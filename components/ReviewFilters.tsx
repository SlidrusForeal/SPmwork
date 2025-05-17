import React from "react";
import { Button } from "./ui";
import { Star, SortAsc, SortDesc } from "lucide-react";

interface ReviewFiltersProps {
  sort: "latest" | "oldest" | "highest" | "lowest";
  onSortChange: (sort: "latest" | "oldest" | "highest" | "lowest") => void;
  minRating: number | null;
  onMinRatingChange: (rating: number | null) => void;
  hasCommentOnly: boolean;
  onHasCommentChange: (hasComment: boolean) => void;
  className?: string;
}

export default function ReviewFilters({
  sort,
  onSortChange,
  minRating,
  onMinRatingChange,
  hasCommentOnly,
  onHasCommentChange,
  className = "",
}: ReviewFiltersProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sort options */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={sort === "latest" ? "primary" : "ghost"}
          className="text-sm py-1.5 px-3"
          onClick={() => onSortChange("latest")}
        >
          <SortDesc className="w-4 h-4 mr-1" />
          Сначала новые
        </Button>
        <Button
          variant={sort === "oldest" ? "primary" : "ghost"}
          className="text-sm py-1.5 px-3"
          onClick={() => onSortChange("oldest")}
        >
          <SortAsc className="w-4 h-4 mr-1" />
          Сначала старые
        </Button>
        <Button
          variant={sort === "highest" ? "primary" : "ghost"}
          className="text-sm py-1.5 px-3"
          onClick={() => onSortChange("highest")}
        >
          <Star className="w-4 h-4 mr-1" />
          Высокий рейтинг
        </Button>
        <Button
          variant={sort === "lowest" ? "primary" : "ghost"}
          className="text-sm py-1.5 px-3"
          onClick={() => onSortChange("lowest")}
        >
          <Star className="w-4 h-4 mr-1" />
          Низкий рейтинг
        </Button>
      </div>

      {/* Rating filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm">Минимальный рейтинг:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() =>
                onMinRatingChange(rating === minRating ? null : rating)
              }
              className={`p-1 rounded-md transition-colors ${
                rating === minRating
                  ? "bg-yellow-100 dark:bg-yellow-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Star
                size={16}
                className={
                  rating <= (minRating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
          {minRating && (
            <button
              onClick={() => onMinRatingChange(null)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Comment filter */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hasCommentOnly}
          onChange={(e) => onHasCommentChange(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
        />
        <span className="text-sm">Только с комментариями</span>
      </label>
    </div>
  );
}
