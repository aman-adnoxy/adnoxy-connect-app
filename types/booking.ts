export type BookingRequest = {
  id: string;
  user_id: string;
  status: 'completed' | 'pending' | 'confirmed' | 'cancelled';
  total_price: number;
  start_date: string;
  end_date: string;
  created_at: string;
};