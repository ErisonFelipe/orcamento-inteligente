export interface CategoryCreate {
  name: string;
  color: string;
}

export interface CategoryUpdate {
  name?: string;
  color?: string;
}

export interface CategoryRead {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}