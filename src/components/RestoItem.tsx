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
  handleVote: (restoId: string, voteType: 'up' | 'down', value: 1 | -1) => void;
  isLoggedIn: boolean;
  isTop: boolean;
  isBottom: boolean;
}

function RestoItem({ resto, handleVote, isLoggedIn, isTop, isBottom }: RestoItemProps) {

  const handleRightClick = (e: React.MouseEvent, voteType: 'up' | 'down') => {
    e.preventDefault();
    if (!isLoggedIn) return;
    handleVote(resto.id, voteType, -1);
  };

  return (
    <Card style={{ marginBottom: '1rem', backgroundColor: isTop ? '#f61' : isBottom ? '#4bf' : 'white' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {resto.name}
            {resto.userUpvotes > 0 && (
                <Chip label={`Tu: ${resto.userUpvotes}`} size="small" color="primary" style={{ marginLeft: 8 }} />
            )}
            {resto.userDownvotes > 0 && (
                <Chip label={`Tu: ${resto.userDownvotes}`} size="small" color="secondary" style={{ marginLeft: 8 }} />
            )}
          </Typography>

          <Box display="flex" alignItems="center">
            <IconButton
              aria-label="upvote"
              onClick={() => handleVote(resto.id, 'up', 1)}
              onContextMenu={(e) => handleRightClick(e, 'up')}
              disabled={!isLoggedIn}
              title="Left-click to vote, Right-click to remove vote"
            >
              <ThumbUpIcon />
            </IconButton>
            <Typography variant="body1" style={{ minWidth: 24, textAlign: 'center' }}>
              {resto.upvotes}
            </Typography>

            <IconButton
              aria-label="downvote"
              onClick={() => handleVote(resto.id, 'down', 1)}
              onContextMenu={(e) => handleRightClick(e, 'down')}
              disabled={!isLoggedIn}
              title="Left-click to veto, Right-click to remove veto"
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