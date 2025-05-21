export type AdminLog = {
  id: string;
  action: 'listing' | 'booking';
  action_id: string;
  admin_id?: string;
  note?: string;
  created_at: string;
};