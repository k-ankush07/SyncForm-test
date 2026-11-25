
import { useState, useEffect, useCallback } from "react";

export default function useRatingField({
  savedValue,
  normalizedElement = {},
  reportChange,
}) {
  const getInitialRating = useCallback(() => {
    const initialValue =
      savedValue ?? normalizedElement.defaultRating ?? 0;

    const numericValue = Number(initialValue);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }, [savedValue, normalizedElement.defaultRating]);

  const [rating, setRating] = useState(getInitialRating);

  useEffect(() => {
    const nextRating = getInitialRating();

    setRating((previous) =>
      previous === nextRating ? previous : nextRating
    );
  }, [normalizedElement.id, getInitialRating]);

  const handleRatingChange = useCallback(
    (nextRating) => {
      setRating(nextRating);
      reportChange(nextRating);
    },
    [reportChange]
  );

  const maxLevel = Math.min(
    10,
    Math.max(2, Number(normalizedElement.maxLevel) || 5)
  );

  const customRatingIcon =
    normalizedElement.useCustomRatingIcon &&
    normalizedElement.ratingIcon
      ? normalizedElement.ratingIcon
      : null;

  const ratingColor =
    normalizedElement.ratingColor || "#2E4E49";

  return {
    rating,
    maxLevel,
    customRatingIcon,
    ratingColor,
    handleRatingChange,
  };
}
