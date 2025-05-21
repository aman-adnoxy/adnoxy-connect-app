// 📦 BookingRequest
export interface BookingRequest {
  id: string;
  user_id: string;     // FK → users.id
  status: 'pending' | 'completed' | 'confirmed' | 'cancelled';
  created_at: Date;
  total_price: string;
}