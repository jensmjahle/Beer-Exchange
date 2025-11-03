// server/entities.ts
export type Event = {
  id: string;
  name: string;
  currency: string;
  status: "draft" | "live" | "closed";
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  image_url?: string | null;
};

export type Customer = {
  id: string;
  event_id: string;
  name: string;
  phone?: string | null;
  shoe_size?: string | null;
  weight?: string | null;
  profile_image_url?: string | null;
  work_relationship?: string | null;
  gender?: string | null;
  sexual_orientation?: string | null;
  ethnicity?: string | null;
  experience_level?: string | null;
};

export type EventBeer = {
  id: string;
  event_id: string;
  beer_id: string;
  name?: string | null;
  volume_ml: number | null;
  abv: number | null;
  description?: string | null;
  brewery?: string | null;
  style?: string | null;
  ibu?: number | null;
  image_url?: string | null;
  base_price: number;
  min_price: number;
  max_price: number;
  current_price: number;
  position: number;
  active: 0 | 1;
};

export type Tx = {
  id: string;
  event_id: string;
  event_beer_id?: string | null;
  customer_id?: string | null;
  qty: number;
  unit_price: number; // the price the customer actually paid (incl. kurtasje)
  volume_ml?: number | null; // store volume with tx
  created_at: string;
};

// server/entities.ts
export type PriceUpdate = {
  id: string;
  event_beer_id: string;
  old_price: number | null;
  new_price: number;
  updated_at: string;
};
