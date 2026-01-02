/**
 * Backed position representing a vouch relationship
 */
export interface BackedPosition {
  borrower: string;
  stakedStars: number;
  stakedCapital: string;
  createdAt: string;
  status: 'Active' | 'Fulfilled' | 'Defaulted';
}
