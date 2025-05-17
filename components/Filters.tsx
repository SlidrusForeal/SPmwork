// components/Filters.tsx
import { FormEvent, useState, useEffect } from "react";
import debounce from "lodash.debounce";
import { Search } from "lucide-react";

export interface FiltersType {
  q?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
}

interface FiltersProps {
  onChange: (filters: FiltersType) => void;
}

export default function Filters({ onChange }: FiltersProps) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minBudget, setMinBudget] = useState<number>();
  const [maxBudget, setMaxBudget] = useState<number>();
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rating, setRating] = useState<number>();

  const debounced = debounce((f: FiltersType) => onChange(f), 300);
  useEffect(() => {
    debounced({
      q,
      category,
      minBudget,
      maxBudget,
      status,
      dateFrom,
      dateTo,
      rating,
    });
    return () => debounced.cancel();
  }, [q, category, minBudget, maxBudget, status, dateFrom, dateTo, rating]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onChange({
      q,
      category,
      minBudget,
      maxBudget,
      status,
      dateFrom,
      dateTo,
      rating,
    });
  };

  return (
    <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 py-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-4 mb-6"
        aria-label="Фильтры заказов"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder="Поиск..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="form-input pl-10"
            aria-label="Поиск по заголовку"
          />
        </div>
        <input
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input"
          aria-label="Фильтр по категории"
        />
        <input
          type="number"
          placeholder="Мин. бюджет"
          value={minBudget ?? ""}
          onChange={(e) => {
            const value = e.target.value ? +e.target.value : undefined;
            if (value === undefined || value >= 0) {
              setMinBudget(value);
            }
          }}
          min="0"
          className="form-input w-36"
          aria-label="Минимальный бюджет"
        />
        <input
          type="number"
          placeholder="Макс. бюджет"
          value={maxBudget ?? ""}
          onChange={(e) => {
            const value = e.target.value ? +e.target.value : undefined;
            if (value === undefined || value >= 0) {
              setMaxBudget(value);
            }
          }}
          min="0"
          className="form-input w-36"
          aria-label="Максимальный бюджет"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="form-select"
          aria-label="Фильтр по статусу"
        >
          <option value="">Все статусы</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
          <option value="dispute">dispute</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="form-input"
          aria-label="Дата с"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="form-input"
          aria-label="Дата по"
        />
        <select
          value={rating ?? ""}
          onChange={(e) =>
            setRating(e.target.value ? +e.target.value : undefined)
          }
          className="form-select w-28"
          aria-label="Фильтр по рейтингу"
        >
          <option value="">Рейтинг</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}★
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn-primary"
          aria-label="Применить фильтры"
        >
          Применить
        </button>
      </form>
    </div>
  );
}
