// src/components/RestoList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress, IconButton, Alert, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Pusher from 'pusher-js';
import { useSession, signIn } from "next-auth/react";
import RestoItem from "./RestoItem";
import { Resto, UserVoteState } from "@/lib/types";

const MAX_UPVOTES_PER_USER = 4;
const MAX_DOWNVOTES_PER_USER = 2;

function RestoList() {
  const [restos, setRestos] = useState<Resto[]>([]);
  const [userVoteState, setUserVoteState] = useState<UserVoteState>({ upvotes: 0, downvotes: 0 });
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;

  const fetchRestos = useCallback(async (email: string | null | undefined) => {
    const url = email ? `/api/restos?userId=${email}` : '/api/restos';
    try {
      setError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
      const { restos, userVoteState } = await response.json();
      console.log("userVoteState", userVoteState);
      setRestos(restos);
      setUserVoteState(userVoteState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  }, []);

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(true);
      fetchRestos(userEmail).finally(() => setIsLoading(false));
    }
  }, [status, userEmail, fetchRestos]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.error("Pusher environment variables are not set.");
      return;
    }
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe('restos-channel');
    channel.bind('restos-updated', () => {
      console.log("Received update signal, refetching data...");
      fetchRestos(userEmail);
    });
    return () => {
      pusher.unsubscribe('restos-channel');
      pusher.disconnect();
    };
  }, [userEmail, fetchRestos]);

  const handleVote = async (restoId: string, voteType: 'up' | 'down') => {
    if (!userEmail) {
      alert("Please sign in to vote.");
      return;
    }

    if (voteType === 'up' && userVoteState.upvotes >= MAX_UPVOTES_PER_USER) {
      console.warn("Frontend upvote limit reached. Ignoring action.");
      return;
    }
    if (voteType === 'down' && userVoteState.downvotes >= MAX_DOWNVOTES_PER_USER) {
      console.warn("Frontend downvote limit reached. Ignoring action.");
      return;
    }

    const originalRestos = [...restos];
    const originalUserVoteState = { ...userVoteState };

    // Update restaurant-specific counts
    setRestos(currentRestos =>
      currentRestos.map(r => {
        if (r.id !== restoId) return r;
        const newResto = { ...r };
        if (voteType === 'up') {
          newResto.upvotes += 1;
          newResto.userUpvotes += 1;
        } else {
          newResto.downvotes += 1;
          newResto.userDownvotes += 1;
        }
        return newResto;
      })
    );

    // --- THIS IS THE FIX ---
    // We remove the optimistic update for the global userVoteState.
    // This prevents the flicker, as we will now only trust the server's response.
    /*
    setUserVoteState(current => ({
      ...current,
      upvotes: current.upvotes + (voteType === 'up' ? 1 : 0),
      downvotes: current.downvotes + (voteType === 'down' ? 1 : 0),
    }));
    */

    try {
      const response = await fetch('/api/restos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoId, voteType }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        alert(`Action failed: ${responseData.error || 'Could not save your vote.'}`);
        setRestos(originalRestos);
        setUserVoteState(originalUserVoteState);
      } else {
        setUserVoteState(responseData.userVoteState);
      }
    } catch (err) {
      console.error("Failed to sync vote:", err);
      alert("A network error occurred. Please try again.");
      setRestos(originalRestos);
      setUserVoteState(originalUserVoteState);
    }
  };

  const addResto = async () => {
    if (newName.trim().length === 0 || !session) return;

    const tempId = crypto.randomUUID();
    const newResto: Resto = {
      id: tempId,
      name: newName.trim(),
      url: "",
      upvotes: 0,
      downvotes: 0,
      userUpvotes: 0,
      userDownvotes: 0
    };

    setRestos(current => [...current, newResto]);
    setNewName("");

    try {
      const response = await fetch('/api/restos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newResto.name, url: newResto.url }),
      });

      if (!response.ok) throw new Error("Failed to save new restaurant");
      // On success, Pusher will trigger a refetch for all clients.
    } catch (err) {
      console.error("Failed to add restaurant:", err);
      setError("Could not save the new restaurant. Please refresh.");
      setRestos(current => current.filter(r => r.id !== tempId)); // Revert
    }
  };

  if (status === 'loading' || isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></div>;
  }

  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Alert severity="error">{error}</Alert></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {session ? (
          <>
            <span style={{ marginRight: '1rem', fontSize: '0.9rem' }}>
                Votes Used: {userVoteState.upvotes}/{MAX_UPVOTES_PER_USER} Up | {userVoteState.downvotes}/{MAX_DOWNVOTES_PER_USER} Down
            </span>
            {/*<Button variant="outlined" size="small" onClick={() => signOut()}>Sign Out</Button>*/}
          </>
        ) : (
          <Button variant="contained" onClick={() => signIn('google')}>Sign In with Google</Button>
        )}
      </header>

      <main>
        {restos.map(resto => (
          <RestoItem
            key={resto.id}
            resto={resto}
            handleVote={handleVote}
            upvotesLeft={MAX_UPVOTES_PER_USER - userVoteState.upvotes}
            downvotesLeft={MAX_DOWNVOTES_PER_USER - userVoteState.downvotes}
            isLoggedIn={!!session}
          />
        ))}
      </main>

      <footer style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          <input
            placeholder={session ? "Add a new restaurant" : "Sign in to add a restaurant"}
            style={{ height: 40, flexGrow: 1, border: '1px solid #ccc', borderRadius: 8, padding: '0 12px', marginRight: '8px' }}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addResto(); }}
            disabled={!session}
          />
          <IconButton size="large" onClick={addResto} disabled={!session || newName.trim().length === 0}>
            <AddIcon color={session ? "primary" : "disabled"} />
          </IconButton>
        </div>
      </footer>
    </div>
  );
}

export default RestoList;