export interface User {
  id: string;
  username: string;
  minecraftUsername?: string;
  minecraftUuid?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  role?: "user" | "moderator" | "admin";
  orders?: number;
  reviews?: number;
  messages?: number;
}

export type OrderStatus = "open" | "in_progress" | "completed" | "dispute";

export interface Order {
  id: string;
  title: string;
  description: string;
  price: number;
  status: OrderStatus;
  buyer_id: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  order_id: string;
  seller_id: string;
  price: number;
  description: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  metadata?: {
    attachment?: {
      url: string;
      filename: string;
    };
  };
}

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | "new_message"
    | "order_status"
    | "new_review"
    | "payment_status"
    | "system_alert";
  title: string;
  message: string;
  link?: string;
  read_at?: string;
  created_at: string;
  metadata?: Record<string, any>;
  order_id?: string;
  message_id?: string;
  review_id?: string;
}
