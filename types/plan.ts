export type Plan = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  listings: string[]; // Array of listing IDs
  start_date: string; // ISO date
  end_date: string; // ISO date
}; 