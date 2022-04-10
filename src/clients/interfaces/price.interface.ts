export interface Price {
  price: number;
  owner: string;
  actionType: 'LISTING' | 'SALE' | 'CANCEL_LISTING';
  escrowAccount: string;
  timestamp: number;
  mint: string;
}
