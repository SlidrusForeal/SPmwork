// components/Filters.tsx
import { FormEvent, useState, useEffect } from "react";
import debounce from "lodash.debounce";

export interface FiltersType {
  q?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FiltersProps {
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

  const debounced = debounce((f: FiltersType) => onChange(f), 300);

  useEffect(() => {
    debounced({ q, category, minBudget, maxBudget, status, dateFrom, dateTo });
    return () => debounced.cancel();
  }, [q, category, minBudget, maxBudget, status, dateFrom, dateTo]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onChange({ q, category, minBudget, maxBudget, status, dateFrom, dateTo });
  };

  return (
    <form className="flex flex-wrap gap-4 mb-6" onSubmit={handleSubmit}>
      <input
        placeholder="Поиск..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="form-input"
      />
      <input
        placeholder="Категория"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="form-input"
      />
      <input
        type="number"
        placeholder="Мин. бюджет"
        value={minBudget ?? ""}
        onChange={(e) =>
          setMinBudget(e.target.value ? +e.target.value : undefined)
        }
        className="form-input w-28"
      />
      <input
        type="number"
        placeholder="Макс. бюджет"
        value={maxBudget ?? ""}
        onChange={(e) =>
          setMaxBudget(e.target.value ? +e.target.value : undefined)
        }
        className="form-input w-28"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="form-select"
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
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="form-input"
      />
      <button type="submit" className="btn-primary">
        Применить
      </button>
    </form>
  );
}
