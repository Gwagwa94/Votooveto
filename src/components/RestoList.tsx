'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IconButton, CircularProgress, Alert } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RestoItem from "./RestoItem"
import Pusher from 'pusher-js';

interface Resto {
    id: string;
    name: string;
    url: string;
    upvotes: number;
    downvotes: number;
}

function RestoList() {
    const [restos, setRestos] = useState<Resto[]>([]);
    const [newName, setNewName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRestos = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch('/api/restos');
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            const data: Resto[] = await response.json();
            setRestos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    }, []);

    // Initial fetch on component mount
    useEffect(() => {
        setIsLoading(true);
        fetchRestos().finally(() => setIsLoading(false));
    }, [fetchRestos]);

    useEffect(() => {
        // Ensure environment variables are loaded before initializing
        if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
            console.error("Pusher environment variables are not set.");
            return;
        }

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe('restos-channel');

        // When we receive the 'restos-updated' event, refetch the data.
        channel.bind('restos-updated', () => {
            console.log("Received update signal, refetching data...");
            fetchRestos();
        });

        // This is a cleanup function. It runs when the component unmounts
        // to prevent memory leaks by closing the connection.
        return () => {
            pusher.unsubscribe('restos-channel');
            pusher.disconnect();
        };
    }, [fetchRestos]);

    const syncWithDb = async (updatedRestos: Resto[]) => {
        try {
            await fetch('/api/restos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRestos),
            });
        } catch (err) {
            console.error("Failed to sync with DB:", err);
            setError("Failed to save the latest changes. Please refresh.");
        }
    };

    const handleVotes = (id: string, vote: number) => {
        const nextRestos = restos.map(resto => {
            if (resto.id !== id) return resto;
            const updatedResto = { ...resto };
            if (vote === 1) updatedResto.upvotes += 1;
            else if (vote === 2 && updatedResto.upvotes > 0) updatedResto.upvotes -= 1;
            else if (vote === -1) updatedResto.downvotes += 1;
            else if (vote === -2 && updatedResto.downvotes > 0) updatedResto.downvotes -= 1;
            return updatedResto;
        });
        setRestos(nextRestos);
        syncWithDb(nextRestos);
    };

    const addResto = () => {
        if (newName.trim().length === 0) return;
        const newResto: Resto = {
            id: crypto.randomUUID(),
            name: newName.trim(),
            url: "",
            upvotes: 0,
            downvotes: 0,
        };
        const nextRestos = [...restos, newResto];
        setRestos(nextRestos);
        setNewName("");
        syncWithDb(nextRestos);
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25%' }}>
            <CircularProgress />
        </div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25%' }}>
            <Alert severity="error">{error}</Alert>
        </div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
            {restos.map(resto => (
                <RestoItem key={resto.id} resto={resto} restoId={resto.id} handleVotes={handleVotes} />
            ))}
            <div style={{ display: 'flex', width: 300, alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <input
                    placeholder="Nombre del restaurante"
                    style={{ height: 30, width: '100%', border: '1px solid #ccc', borderRadius: 10, padding: '0 8px' }}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addResto(); }}
                />
                <IconButton size="large" onClick={addResto}>
                    <AddIcon color="action" />
                </IconButton>
            </div>
        </div>
    );
}

export default RestoList;