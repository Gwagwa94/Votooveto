import { createClient } from 'redis';
import { NextResponse } from 'next/server';

// The Resto interface remains the same, which is great for type safety.
export interface Resto {
    id: string;
    name: string;
    url: string;
    upvotes: number;
    downvotes: number;
}

// The default data for initialization also remains the same.
const defaultRestos: Resto[] = [
    {
        id: 'a1b2c3d4',
        name: "Italian bug",
        url: "https://wikipedia.org/wiki/Insect",
        upvotes: 0,
        downvotes: 0,
    },
    {
        id: 'e5f6g7h8',
        name: "Tierra Burrito",
        url: "https://www.tierraburritos.com/",
        upvotes: 0,
        downvotes: 0,
    }
];

// --- NEW: Redis Client Setup ---

// 1. Create a single Redis client instance.
// It will use the REDIS_URL from your .env.local file.
const redis = createClient({
    url: process.env.REDIS_URL
});

// 2. Add an error listener for better debugging.
redis.on('error', (err) => console.error('Redis Client Error', err));

// 3. A helper function to ensure the client is connected before use.
async function getConnectedRedisClient() {
    if (!redis.isOpen) {
        await redis.connect();
    }
    return redis;
}

// --- END: Redis Client Setup ---


// Handles GET requests to /api/restos
export async function GET() {
    try {
        const client = await getConnectedRedisClient();

        // Fetch the data as a string from Redis.
        const restosJSON = await client.get('restos');

        let restos: Resto[];

        if (!restosJSON) {
            // If the database is empty, use the default data...
            restos = defaultRestos;
            // ...and save it to Redis for the next request.
            // We must stringify the object before saving.
            await client.set('restos', JSON.stringify(defaultRestos));
        } else {
            // If data exists, we must parse the JSON string back into an object.
            restos = JSON.parse(restosJSON);
        }

        return NextResponse.json(restos);
    } catch (error) {
        console.error('Failed to fetch restos:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Handles POST requests to /api/restos
export async function POST(request: Request) {
    try {
        const client = await getConnectedRedisClient();
        const updatedRestos = await request.json() as Resto[];

        // Stringify the incoming array before setting it in Redis.
        await client.set('restos', JSON.stringify(updatedRestos));

        return NextResponse.json({ success: true, restos: updatedRestos });
    } catch (error) {
        console.error('Failed to update restos:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}