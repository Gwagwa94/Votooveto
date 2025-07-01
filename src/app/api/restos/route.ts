import { createClient } from 'redis';
import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

export interface Resto {
    id: string;
    name: string;
    url: string;
    upvotes: number;
    downvotes: number;
}

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

// The GET function does not need to change.
export async function GET() {
    try {
        const client = await getConnectedRedisClient();
        const restosJSON = await client.get('restos');
        let restos: Resto[];

        if (!restosJSON) {
            restos = defaultRestos;
            await client.set('restos', JSON.stringify(defaultRestos));
        } else {
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

        // 1. Save to the database
        await client.set('restos', JSON.stringify(updatedRestos));

        // 2. --- Publish the update to all clients ---
        await pusher.trigger('restos-channel', 'restos-updated', {
            message: 'The restaurant list has been updated.'
        });

        return NextResponse.json({ success: true, restos: updatedRestos });
    } catch (error) {
        console.error('Failed to update restos:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}