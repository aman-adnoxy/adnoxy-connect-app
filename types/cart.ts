export interface CartItem {
  user_id: string;
  listing_id: string;
  start_date: Date;
  end_date: Date;
  added_at: string;
}

export type Cart = CartItem[];