export interface Event {
  id: string;
  name: string;
  description: string;
  start_date: Date;
  photo: string;
  price: number;
}

export type CreateEventProps = Exclude<Event, 'id'>