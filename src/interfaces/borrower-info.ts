/**
 * Borrower information combining reputation and vouch data
 */
export interface BorrowerInfo {
  stars: number;
  starsAtStake: number;
  canVouch: boolean;
  banned: boolean;
  creationTime: string;
  loanHistoryCount: number;
  vouchHistoryCount: number;
  totalExposure: string;
}
