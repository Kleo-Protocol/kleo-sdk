/**
 * Vouch information for a borrower
 */
export interface VouchInfo {
  voucher: string;
  stakedStars: number;
  stakedCapital: string;
  createdAt: string;
  status: 'Active' | 'Fulfilled' | 'Defaulted';
}
