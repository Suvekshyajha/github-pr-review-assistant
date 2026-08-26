export type RepositoryTone = 'cyan' | 'violet' | 'amber';

export type Repository = {
  id: string;
  owner: string;
  name: string;
  connected: string;
  tone: RepositoryTone;
  reviews: number;
  lastReview: string;
  branch: string;
  webhook: string;
};