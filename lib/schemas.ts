import { z } from "zod";
import { validOrderCategories, type OrderCategory } from "./validation";

export const OrderSchema = z.object({
  title: z
    .string()
    .min(5, "Заголовок должен быть от 5 до 100 символов")
    .max(100, "Заголовок должен быть от 5 до 100 символов")
    .trim(),
  description: z
    .string()
    .min(20, "Описание должно быть от 20 до 2000 символов")
    .max(2000, "Описание должно быть от 20 до 2000 символов")
    .trim(),
  category: z.custom<OrderCategory>(
    (val): val is OrderCategory =>
      typeof val === "string" && validOrderCategories.includes(val as any)
  ),
  budget: z
    .number()
    .min(1, "Бюджет должен быть от 1 до 1,000,000")
    .max(1000000, "Бюджет должен быть от 1 до 1,000,000"),
});

export const ReviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Оценка должна быть от 1 до 5")
    .max(5, "Оценка должна быть от 1 до 5"),
  comment: z
    .string()
    .max(1000, "Комментарий не может быть длиннее 1000 символов")
    .optional(),
});

export const OfferSchema = z.object({
  price: z
    .number()
    .min(1, "Цена должна быть положительной")
    .max(1000000, "Цена не может превышать 1,000,000"),
  description: z
    .string()
    .min(20, "Описание должно быть от 20 до 1000 символов")
    .max(1000, "Описание должно быть от 20 до 1000 символов")
    .trim(),
});

export const MessageSchema = z.object({
  content: z
    .string()
    .min(1, "Сообщение не может быть пустым")
    .max(2000, "Сообщение не может быть длиннее 2000 символов")
    .trim(),
  metadata: z
    .object({
      attachment: z.object({
        url: z.string().url("Неверный URL файла"),
        filename: z.string(),
      }),
    })
    .optional(),
});

// Типы на основе схем
export type OrderInput = z.infer<typeof OrderSchema>;
export type ReviewInput = z.infer<typeof ReviewSchema>;
export type OfferInput = z.infer<typeof OfferSchema>;
export type MessageInput = z.infer<typeof MessageSchema>;
