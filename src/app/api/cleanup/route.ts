// src/app/api/cleanup/route.ts
import { createClient } from 'redis';
import { NextResponse } from 'next/server';

// IMPORTANT: This endpoint is for development cleanup only.
// It finds all vote and user vote keys and deletes them to reset the state.

export async function GET() {
  // This check is a critical security measure to ensure this
  // endpoint can NEVER run in a production environment.
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This action is forbidden in production.' },
      { status: 403 }
    );
  }

  console.log("--- Starting Redis Cleanup ---");
  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();

  try {
    const pipeline = client.multi();
    let deletedKeysCount = 0;

    // 1. Clean up restaurant-specific vote hashes
    const restoIds = await client.sMembers('restos:ids');
    console.log(`Found ${restoIds.length} restaurants to clean...`);
    for (const id of restoIds) {
      pipeline.del(`votes:${id}:up`);
      pipeline.del(`votes:${id}:down`);
      deletedKeysCount += 2;
    }

    // 2. Clean up all user-specific vote count hashes
    const userVoteKeys = await client.keys('user:votes:*');
    console.log(`Found ${userVoteKeys.length} user vote records to clean...`);
    if (userVoteKeys.length > 0) {
      pipeline.del(userVoteKeys);
      deletedKeysCount += userVoteKeys.length;
    }

    await pipeline.exec();

    console.log(`--- Redis Cleanup Complete. Deleted ${deletedKeysCount} keys. ---`);
    return NextResponse.json({ message: `Cleanup successful. Deleted ${deletedKeysCount} keys.` });

  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  } finally {
    await client.disconnect();
  }
}