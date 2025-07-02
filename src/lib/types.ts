export interface Resto {
  id: string;
  name: string;
  url: string;
  upvotes: number; // Total upvotes from all users
  downvotes: number; // Total downvotes from all users
  userUpvotes: number; // How many times THIS user has upvoted this restaurant
  userDownvotes: number; // How many times THIS user has downvoted this restaurant
}

export interface UserVoteState {
  upvotes: number;
  downvotes: number;
}