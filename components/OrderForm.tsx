import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import { ErrorAlert } from "./ui/ErrorAlert";
import { validOrderCategories } from "../lib/validation";

interface OrderFormData {
  title: string;
  description: string;
  category: string;
  budget: string;
}

const initialFormData: OrderFormData = {
  title: "",
  description: "",
  category: "development",
  budget: "",
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
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user makes changes
  };

  const validateForm = (): string | null => {
    if (
      !formData.title ||
      formData.title.length < 5 ||
      formData.title.length > 100
    ) {
      return "Заголовок должен быть от 5 до 100 символов";
    }

    if (
      !formData.description ||
      formData.description.length < 20 ||
      formData.description.length > 2000
    ) {
      return "Описание должно быть от 20 до 2000 символов";
    }

    if (!validOrderCategories.includes(formData.category as any)) {
      return `Категория должна быть одной из: ${validOrderCategories.join(
        ", "
      )}`;
    }

    const budget = Number(formData.budget);
    if (isNaN(budget) || budget <= 0 || budget > 1000000) {
      return "Бюджет должен быть числом от 1 до 1,000,000";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget),
        }),
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
          className="block text-sm font-medium text-gray-700"
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
          className="block text-sm font-medium text-gray-700"
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
          className="block text-sm font-medium text-gray-700"
        >
          Категория
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white"
          required
        >
          {validOrderCategories.map((category) => (
            <option key={category} value={category}>
              {categoryTranslations[category]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="budget"
          className="block text-sm font-medium text-gray-700"
        >
          Бюджет
        </label>
        <Input
          id="budget"
          name="budget"
          type="number"
          value={formData.budget}
          onChange={handleChange}
          placeholder="Введите бюджет (от 1 до 1,000,000)"
          required
          min={1}
          max={1000000}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Создание..." : "Создать заказ"}
      </Button>
    </form>
  );
}
