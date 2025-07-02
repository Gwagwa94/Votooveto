// src/app/api/restos/delete/route.ts

import { createClient, RedisClientType } from 'redis';
import { NextResponse } from 'next/server';

/**
 * Handles DELETE requests to /api/restos/delete.
 * Deletes the 'restos' key from the Redis database.
 * This endpoint is protected and will only run in a development environment.
 */
export async function DELETE() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'This action is forbidden in production.' },
            { status: 403 }
        );
    }

    let redisClient: RedisClientType | undefined;
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });
        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await redisClient.connect();

        const result = await redisClient.del('restos');

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