// components/Filters.tsx
import { FormEvent, useState } from "react";

interface Filters {
  category: string;
  minBudget?: number;
  maxBudget?: number;
}

interface FiltersProps {
  onChange: (filters: Filters) => void;
}

export default function Filters({ onChange }: FiltersProps) {
  const [category, setCategory] = useState<string>("");
  const [minBudget, setMinBudget] = useState<number>();
  const [maxBudget, setMaxBudget] = useState<number>();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onChange({ category, minBudget, maxBudget });
  };

  return (
    <form className="flex flex-wrap gap-4 mb-6" onSubmit={handleSubmit}>
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
      <button type="submit" className="btn-primary">
        Применить
      </button>
    </form>
  );
}
