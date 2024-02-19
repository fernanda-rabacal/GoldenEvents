export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string;
  start_date: Date;
  photo: string;
  price: number;
  category: number;
  capacity: number;
  created_at: number;
}

export type CreateEventProps = Omit<Event, 'id' | 'created_at'>