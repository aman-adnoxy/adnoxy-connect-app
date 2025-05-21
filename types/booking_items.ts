export type BookingItem = {
  id: string;
  booking_id: string;
  listing_id: string;
  proposed_price?: number;
  proposed_dates?: string;
  notes?: string;
};