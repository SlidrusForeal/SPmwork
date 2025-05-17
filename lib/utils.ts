import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v5 as uuidv5 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // UUID namespace for URLs

/**
 * Converts a Discord snowflake ID to a UUID v5
 * This ensures consistent UUID generation for the same Discord ID
 */
export function snowflakeToUuid(snowflake: string | number): string {
  const snowflakeStr = snowflake.toString();
  return uuidv5(snowflakeStr, NAMESPACE);
}
