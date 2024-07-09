export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  photo: string;
  price: number;
  category_id: number;
  location: string;
  capacity: number;
  active: boolean;
  quantity_left: number;
  created_at: string;
}

export type CreateEventProps = Omit<Event, 'id' | 'created_at'>

export interface EventCategory {
  id: number;
  name: string;
  photo: string;
}