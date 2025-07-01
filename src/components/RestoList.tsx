'use client'

import React, { useState, useEffect } from 'react'
import { IconButton, CircularProgress, Alert } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RestoItem from "./RestoItem"

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

    // Fetch initial data from our API endpoint
    useEffect(() => {
        const fetchRestos = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch('/api/restos');
                if (!response.ok) {
                    throw new Error('Failed to fetch data from server.');
                }
                const data: Resto[] = await response.json();
                setRestos(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestos();
    }, []); // Empty dependency array means this runs once on component mount

    // A single function to save the entire list to the backend
    const syncWithDb = async (updatedRestos: Resto[]) => {
        try {
            await fetch('/api/restos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRestos),
            });
        } catch (err) {
            console.error("Failed to sync with DB:", err);
            // Optional: Add logic to notify user that the latest change might not have been saved
            setError("Failed to save the latest changes. Please refresh.");
        }
    };

    // Handles vote changes, now using a unique ID
    const handleVotes = (id: string, vote: number) => {
        const nextRestos = restos.map(resto => {
            if (resto.id !== id) {
                return resto;
            }
            // Create a new object to avoid direct state mutation
            const updatedResto = { ...resto };
            if (vote === 1) updatedResto.upvotes += 1;
            else if (vote === 2 && updatedResto.upvotes > 0) updatedResto.upvotes -= 1;
            else if (vote === -1) updatedResto.downvotes += 1;
            else if (vote === -2 && updatedResto.downvotes > 0) updatedResto.downvotes -= 1;
            return updatedResto;
        });
        // Optimistically update the UI
        setRestos(nextRestos);
        // Sync the full updated list with the database
        syncWithDb(nextRestos);
    };

    const addResto = () => {
        if (newName.trim().length === 0) {
            return;
        }
        const newResto: Resto = {
            id: crypto.randomUUID(), // Generate a unique ID on the client
            name: newName.trim(),
            url: "",
            upvotes: 0,
            downvotes: 0,
        };
        const nextRestos = [...restos, newResto];
        // Optimistically update the UI
        setRestos(nextRestos);
        setNewName("");
        // Sync the full updated list with the database
        syncWithDb(nextRestos);
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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