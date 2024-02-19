export interface EventQuery {
  user_id: number;
  name: string;
  category_id: number;
  take: number;
  skip: number;
  start_date: string;
}