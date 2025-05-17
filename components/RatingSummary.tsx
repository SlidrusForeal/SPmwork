import React from "react";
import { Star } from "lucide-react";

interface RatingSummaryProps {
  reviews: {
    rating: number;
  }[];
  className?: string;
}

export default function RatingSummary({
  reviews,
  className = "",
}: RatingSummaryProps) {
  if (reviews.length === 0) {
    return null;
  }

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating =
    reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews;

  // Count ratings by star
  const ratingCounts = reviews.reduce((acc, rev) => {
    acc[rev.rating] = (acc[rev.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Calculate percentages for the progress bars
  const getPercentage = (rating: number) => {
    return ((ratingCounts[rating] || 0) / totalReviews) * 100;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Average rating display */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={`${
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500">
            {totalReviews} {totalReviews === 1 ? "отзыв" : "отзывов"}
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center gap-2">
            <div className="flex gap-0.5 w-24">
              <span className="text-sm">{rating}</span>
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${getPercentage(rating)}%` }}
              />
            </div>
            <div className="w-12 text-sm text-gray-500 text-right">
              {ratingCounts[rating] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
