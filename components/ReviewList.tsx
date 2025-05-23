import React from "react";
import { Star } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: {
    username: string;
    minecraftUsername?: string;
    minecraftUuid?: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  className?: string;
}

export default function ReviewList({
  reviews,
  className = "",
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        Отзывов пока нет
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border dark:border-gray-700 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {review.reviewer.minecraftUuid && (
                <div className="relative w-10 h-10">
                  <Image
                    src={`https://crafatar.com/avatars/${review.reviewer.minecraftUuid}?overlay`}
                    alt={review.reviewer.username}
                    fill
                    className="rounded-lg"
                  />
                </div>
              )}
              <div>
                <div className="font-medium">
                  {review.reviewer.username}
                  {review.reviewer.minecraftUsername && (
                    <span className="text-gray-500 text-sm ml-2">
                      ({review.reviewer.minecraftUsername})
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`${
                    star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
