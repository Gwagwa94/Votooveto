// src/app/api/restos/delete/route.ts

import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const redis = createClient({
    url: process.env.REDIS_URL
});

redis.on('error', (err) => console.error('Redis Client Error', err));

async function getConnectedRedisClient() {
    if (!redis.isOpen) {
        await redis.connect();
    }
    return redis;
}

/**
 * Handles DELETE requests to /api/restos/delete.
 * Deletes the 'restos' key from the Redis database.
 */
export async function DELETE() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'This action is forbidden in production.' },
            { status: 403 }
        );
    }

    try {
        const client = await getConnectedRedisClient();
        const result = await client.del('restos');

        if (result > 0) {
            return NextResponse.json({ message: 'All restaurants have been deleted successfully.' });
        } else {
            return NextResponse.json({ message: 'No restaurants found to delete.' });
        }

    } catch (error) {
        console.error('Failed to delete restos:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}