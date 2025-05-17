import { OrderStatus } from "../types";

const validOrderStatuses: OrderStatus[] = [
  "open",
  "in_progress",
  "completed",
  "dispute",
];

export const validOrderCategories = [
  "development",
  "design",
  "writing",
  "marketing",
  "other",
] as const;

export type OrderCategory = (typeof validOrderCategories)[number];

export function isValidOrderStatus(status: any): status is OrderStatus {
  return (
    typeof status === "string" &&
    validOrderStatuses.includes(status as OrderStatus)
  );
}

export function validateOrderStatus(status: any): OrderStatus {
  if (!isValidOrderStatus(status)) {
    throw new Error(
      `Invalid order status: ${status}. Must be one of: ${validOrderStatuses.join(
        ", "
      )}`
    );
  }
  return status;
}

export function isValidOrderCategory(category: any): category is OrderCategory {
  return (
    typeof category === "string" &&
    validOrderCategories.includes(category as OrderCategory)
  );
}

export function validateOrderCategory(category: any): OrderCategory {
  if (!isValidOrderCategory(category)) {
    throw new Error(
      `Invalid order category: ${category}. Must be one of: ${validOrderCategories.join(
        ", "
      )}`
    );
  }
  return category;
}

export function getNextOrderStatus(currentStatus: OrderStatus): OrderStatus {
  switch (currentStatus) {
    case "open":
      return "in_progress";
    case "in_progress":
      return "completed";
    case "completed":
      return "completed";
    case "dispute":
      return "dispute";
    default:
      throw new Error(`Invalid order status: ${currentStatus}`);
  }
}

export function canTransitionToStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  switch (currentStatus) {
    case "open":
      return ["in_progress", "dispute"].includes(newStatus);
    case "in_progress":
      return ["completed", "dispute"].includes(newStatus);
    case "completed":
      return ["dispute"].includes(newStatus);
    case "dispute":
      return ["completed", "in_progress"].includes(newStatus);
    default:
      return false;
  }
}

// New validation functions

export function validateOrderTitle(title: string): string {
  if (!title || typeof title !== "string") {
    throw new Error("Order title is required");
  }
  if (title.length < 5 || title.length > 100) {
    throw new Error("Order title must be between 5 and 100 characters");
  }
  return title.trim();
}

export function validateOrderDescription(description: string): string {
  if (!description || typeof description !== "string") {
    throw new Error("Order description is required");
  }
  if (description.length < 20 || description.length > 2000) {
    throw new Error("Order description must be between 20 and 2000 characters");
  }
  return description.trim();
}

export function validateOrderPrice(price: number): number {
  if (typeof price !== "number" || isNaN(price)) {
    throw new Error("Price must be a valid number");
  }
  if (price < 0) {
    throw new Error("Price cannot be negative");
  }
  if (price > 1000000) {
    throw new Error("Price cannot exceed 1,000,000");
  }
  return price;
}

export function validateReviewRating(rating: number): number {
  if (typeof rating !== "number" || isNaN(rating)) {
    throw new Error("Rating must be a valid number");
  }
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  return Math.round(rating);
}

export function validateReviewComment(comment?: string): string | undefined {
  if (!comment) return undefined;
  if (typeof comment !== "string") {
    throw new Error("Review comment must be a string");
  }
  if (comment.length > 1000) {
    throw new Error("Review comment cannot exceed 1000 characters");
  }
  return comment.trim();
}

export function canUserReviewOrder(
  orderStatus: OrderStatus,
  isOrderCompleted: boolean,
  hasExistingReview: boolean
): boolean {
  return orderStatus === "completed" && isOrderCompleted && !hasExistingReview;
}

export function validateOfferPrice(
  offerPrice: number,
  orderPrice: number
): number {
  const price = validateOrderPrice(offerPrice);
  if (price > orderPrice * 2) {
    throw new Error("Offer price cannot be more than double the order price");
  }
  return price;
}
