// src/components/RestoItem.tsx
'use client';

import React from 'react';
import { Card, CardContent, Typography, IconButton, Box, Chip } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { Resto } from '@/lib/types';

// Define the props for this component
interface RestoItemProps {
  resto: Resto;
  handleVote: (restoId: string, voteType: 'up' | 'down') => void;
  upvotesLeft: number;
  downvotesLeft: number;
  isLoggedIn: boolean;
}

function RestoItem({ resto, handleVote, upvotesLeft, downvotesLeft, isLoggedIn }: RestoItemProps) {
  return (
    <Card variant="outlined" style={{ marginBottom: '1rem' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {resto.name}
            {resto.userUpvotes > 0 && (
                <Chip label={`Tu: ${resto.userUpvotes}`} size="small" color="primary" variant="outlined" style={{ marginLeft: 8 }} />
            )}
            {resto.userDownvotes > 0 && (
                <Chip label={`Tu: ${resto.userDownvotes}`} size="small" color="secondary" variant="outlined" style={{ marginLeft: 8 }} />
            )}
          </Typography>

          <Box display="flex" alignItems="center">
            <IconButton
              aria-label="upvote"
              onClick={() => handleVote(resto.id, 'up')}
              disabled={!isLoggedIn || upvotesLeft <= 0}
            >
              <ThumbUpIcon />
            </IconButton>
            <Typography variant="body1" style={{ minWidth: 24, textAlign: 'center' }}>
              {resto.upvotes}
            </Typography>

            <IconButton
              aria-label="downvote"
              onClick={() => handleVote(resto.id, 'down')}
              disabled={!isLoggedIn || downvotesLeft <= 0}
            >
              <ThumbDownIcon />
            </IconButton>
            <Typography variant="body1" style={{ minWidth: 24, textAlign: 'center' }}>
              {resto.downvotes}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default RestoItem;