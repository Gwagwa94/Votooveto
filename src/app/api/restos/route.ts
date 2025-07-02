// src/app/api/restos/route.ts
import {NextResponse} from 'next/server';
import Pusher from 'pusher';
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {Resto, UserVoteState} from "@/lib/types";
import {redis} from '@/lib/redis';

const MAX_UPVOTES_PER_USER = 4;
const MAX_DOWNVOTES_PER_USER = 2;

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

const sumHashValues = (hash: { [key: string]: string }): number => {
  return Object.values(hash).reduce((sum, current) => sum + parseInt(current || '0', 10), 0);
}

// --- GET: Fetch all restaurants and user's vote state ---
export async function GET() {
  const client = await redis;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  try {
    const restoIds = await client.sMembers('restos:ids');
    const restos: Resto[] = [];

    // Fetch user's total vote counts
    let userVoteState: UserVoteState = {upvotes: 0, downvotes: 0};
    if (userId) {
      const userVoteCounts = await client.hGetAll(`user:votes:${userId}`);
      userVoteState = {
        upvotes: parseInt(userVoteCounts.ups || '0', 10),
        downvotes: parseInt(userVoteCounts.downs || '0', 10),
      };
    }

    for (const id of restoIds) {
      const restoDetails = await client.hGetAll(`resto:${id}`);

      // Fetch all votes for the restaurant and the specific user's votes
      const [upvotesHash, downvotesHash, userUpvotes, userDownvotes] = await Promise.all([
        client.hGetAll(`votes:${id}:up`),
        client.hGetAll(`votes:${id}:down`),
        userId ? client.hGet(`votes:${id}:up`, userId) : '0',
        userId ? client.hGet(`votes:${id}:down`, userId) : '0',
      ]);

      restos.push({
        id,
        name: restoDetails.name || 'Unknown',
        url: restoDetails.url || '',
        upvotes: sumHashValues(upvotesHash),
        downvotes: sumHashValues(downvotesHash),
        userUpvotes: parseInt(userUpvotes || '0', 10),
        userDownvotes: parseInt(userDownvotes || '0', 10),
      });
    }

    restos.sort((a, b) => b.upvotes - a.upvotes);

    // Return a new shape including the user's global vote state
    return NextResponse.json({restos, userVoteState});

  } catch (error) {
    console.error('Failed to fetch restos:', error);
    return new NextResponse('Internal Server Error', {status: 500});
  }
}

// --- POST: Create a new restaurant ---
export async function POST(request: Request) {
  const client = await redis;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  const {name, url} = await request.json();
  if (!name || name.trim().length === 0) {
    return NextResponse.json({error: 'Restaurant name is required.'}, {status: 400});
  }

  const newRestoId = crypto.randomUUID();

  try {
    const transaction = client.multi();
    transaction.sAdd('restos:ids', newRestoId);
    transaction.hSet(`resto:${newRestoId}`, {name, url: url || ''});
    await transaction.exec();

    await pusher.trigger('restos-channel', 'restos-updated', {
      message: `New restaurant added: ${name}`
    });

    return NextResponse.json({success: true, id: newRestoId});
  } catch (error) {
    console.error('Failed to add restaurant:', error);
    return new NextResponse('Internal Server Error', {status: 500});
  }
}

// --- PUT: Process a single, incremental vote ---
export async function PUT(request: Request) {
  const client = await redis;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }
  const userId = session.user.email;

  const {restoId, voteType} = await request.json();

  if (!restoId || !['up', 'down'].includes(voteType)) {
    return NextResponse.json({error: 'Missing or invalid required fields.'}, {status: 400});
  }

  const userVotesKey = `user:votes:${userId}`;

  try {
    // Check the user's global vote limit first
    const userVoteCounts = await client.hGetAll(userVotesKey);
    const currentUpvotes = parseInt(userVoteCounts.ups || '0', 10);
    const currentDownvotes = parseInt(userVoteCounts.downs || '0', 10);
    console.log("currentUpVotes", userVoteCounts, currentUpvotes);

    if (voteType === 'up' && currentUpvotes >= MAX_UPVOTES_PER_USER) {
      return NextResponse.json({error: `Upvote limit of ${MAX_UPVOTES_PER_USER} reached.`}, {status: 403});
    }
    if (voteType === 'down' && currentDownvotes >= MAX_DOWNVOTES_PER_USER) {
      return NextResponse.json({error: `Downvote limit of ${MAX_DOWNVOTES_PER_USER} reached.`}, {status: 403});
    }

    // Use a transaction to increment both the user's total and the restaurant's specific vote
    const transaction = client.multi();
    const voteKey = `votes:${restoId}:${voteType}`;
    const userVoteField = `${voteType}s`;

    transaction.hIncrBy(voteKey, userId, 1);
    transaction.hIncrBy(userVotesKey, userVoteField, 1);
    await transaction.exec();

    // After successfully voting, get the new total vote counts for the user
    const newUserVoteCounts = await client.hGetAll(userVotesKey);
    const newUserVoteState: UserVoteState = {
        upvotes: parseInt(newUserVoteCounts.ups || '0', 10),
        downvotes: parseInt(newUserVoteCounts.downs || '0', 10),
    };

    // Trigger Pusher for OTHER clients
    await pusher.trigger('restos-channel', 'restos-updated', {
      message: `Vote updated for ${restoId}`
    });

    // Return the new state to the client that made the request
    return NextResponse.json({ success: true, userVoteState: newUserVoteState });

  } catch (error) {
    console.error('Failed to process vote:', error);
    return new NextResponse('Internal Server Error', {status: 500});
  }
}