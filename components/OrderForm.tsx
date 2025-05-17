import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import { ErrorAlert } from "./ui/ErrorAlert";
import { validOrderCategories } from "../lib/validation";
import { OrderSchema, type OrderInput } from "../lib/schemas";

const initialFormData: OrderInput = {
  title: "",
  description: "",
  category: "development",
  budget: 0,
};

// Группировка категорий по типам
const categoryGroups = {
  building: {
    label: "Строительство",
    categories: ["building_construction", "building_design", "farm_building"],
  },
  art: {
    label: "Искусство",
    categories: ["drawing", "art_redesign"],
  },
  development: {
    label: "Разработка",
    categories: ["development", "design"],
  },
  resources: {
    label: "Ресурсы",
    categories: ["resource_gathering"],
  },
  content: {
    label: "Контент",
    categories: ["fanfic_writing"],
  },
  other: {
    label: "Прочее",
    categories: ["other"],
  },
};

const categoryTranslations: Record<string, string> = {
  resource_gathering: "Добыча ресурсов",
  building_construction: "Постройка зданий",
  building_design: "Проектировка зданий",
  drawing: "Рисование картинок",
  art_redesign: "Перестройка артов",
  fanfic_writing: "Написание фанфиков",
  farm_building: "Постройка ферм",
  development: "Разработка",
  design: "Дизайн",
  other: "Другое",
};

export function OrderForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<OrderInput>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" ? Number(value) : value,
    }));
    setError(null); // Clear error when user makes changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation using Zod
    const result = OrderSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Не удалось создать заказ");
      }

      const data = await response.json();
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Заголовок
        </label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Введите заголовок заказа (от 5 до 100 символов)"
          required
          minLength={5}
          maxLength={100}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Описание
        </label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Подробно опишите ваш заказ (от 20 до 2000 символов)"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Категория
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:border-primary focus:ring-primary sm:text-sm 
                   bg-white dark:bg-gray-800 dark:border-gray-600 
                   dark:text-gray-200"
          required
        >
          {Object.entries(categoryGroups).map(([groupKey, group]) => (
            <optgroup key={groupKey} label={group.label}>
              {group.categories.map((category) => (
                <option key={category} value={category}>
                  {categoryTranslations[category]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="budget"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Бюджет
        </label>
        <Input
          id="budget"
          name="budget"
          type="number"
          value={formData.budget || ""}
          onChange={handleChange}
          placeholder="Введите бюджет (от 1 до 1,000,000)"
          required
          min={1}
          max={1000000}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Создание..." : "Создать заказ"}
        </Button>
      </div>
    </form>
  );
}
