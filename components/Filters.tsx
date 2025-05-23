// components/Filters.tsx
import { FormEvent, useState, useEffect } from "react";
import debounce from "lodash.debounce";
import {
  Search,
  ArrowDownUp,
  CalendarDays,
  Star,
  ListFilter,
} from "lucide-react";

export interface FiltersType {
  searchTerm?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
}

interface FiltersProps {
  onChange: (filters: FiltersType) => void;
}

export default function Filters({ onChange }: FiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [minBudget, setMinBudget] = useState<number>();
  const [maxBudget, setMaxBudget] = useState<number>();
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rating, setRating] = useState<number>();

  const debounced = debounce((f: FiltersType) => onChange(f), 500);
  useEffect(() => {
    debounced({
      searchTerm,
      category,
      minBudget,
      maxBudget,
      status,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
      rating,
    });
    return () => debounced.cancel();
  }, [
    searchTerm,
    category,
    minBudget,
    maxBudget,
    status,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
    rating,
  ]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onChange({
      searchTerm,
      category,
      minBudget,
      maxBudget,
      status,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
      rating,
    });
  };

  return (
    <div className="sticky top-0 bg-background dark:bg-background-dark z-10 py-4 mb-6 border-b border-border dark:border-border-dark">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        aria-label="Фильтры заказов"
      >
        <div className="relative col-span-full sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            placeholder="Поиск по названию/описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 w-full"
            aria-label="Поиск по названию или описанию"
          />
        </div>
        <input
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input w-full"
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
          className="form-input w-full"
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
          className="form-input w-full"
          aria-label="Максимальный бюджет"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="form-select w-full"
          aria-label="Фильтр по статусу"
        >
          <option value="">По умолчанию (открытые)</option>
          <option value="open">Открытые</option>
          <option value="in_progress">В процессе</option>
          <option value="completed">Завершенные</option>
          <option value="dispute">Спорные</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="form-select w-full"
          aria-label="Сортировать по"
        >
          <option value="created_at">Дате</option>
          <option value="budget">Бюджету</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          className="form-select w-full"
          aria-label="Порядок сортировки"
        >
          <option value="desc">Убыванию</option>
          <option value="asc">Возрастанию</option>
        </select>
      </form>
    </div>
  );
}
