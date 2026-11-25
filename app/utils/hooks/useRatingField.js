
import { useState, useEffect, useCallback, useMemo } from "react";

export default function useRatingField({
  savedValue,
  normalizedElement = {},
  reportChange,
}) {
  // 1. Initial rating
  const getInitialRating = useCallback(() => {
    const initialValue =
      savedValue ?? normalizedElement.defaultRating ?? 0;

    const numericValue = Number(initialValue);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }, [savedValue, normalizedElement.defaultRating]);

  const [rating, setRating] = useState(getInitialRating);

  // 2. Sync rating when element changes
  useEffect(() => {
    const nextRating = getInitialRating();

    setRating((previous) =>
      previous === nextRating ? previous : nextRating
    );
  }, [normalizedElement.id, getInitialRating]);

  // 3. Rating selection
  const handleRatingChange = useCallback(
    (nextRating) => {
      setRating(nextRating);
      reportChange(nextRating);
    },
    [reportChange]
  );

  // 4. Rating level configuration
  const maxLevel = Math.min(
    10,
    Math.max(2, Number(normalizedElement.maxLevel) || 5)
  );

  const ratingLevels = useMemo(
    () => Array.from({ length: maxLevel }, (_, index) => index + 1),
    [maxLevel]
  );

  // 5. Star configuration
  const ratingStars = useMemo(
    () => [1, 2, 3, 4, 5],
    []
  );

  // 6. Custom icon
  const customRatingIcon =
    normalizedElement.useCustomRatingIcon &&
    normalizedElement.ratingIcon
      ? normalizedElement.ratingIcon
      : null;

  // 7. Rating color
  const ratingColor =
    normalizedElement.ratingColor || "#2E4E49";

  // 8. Display settings
  const showNumberUnderIcon = Boolean(
    normalizedElement.showNumberUnderIcon
  );

  const lowLabel = normalizedElement.lowLabel || "Low";
  const highLabel = normalizedElement.highLabel || "High";

  return {
    rating,
    maxLevel,
    ratingLevels,
    ratingStars,
    customRatingIcon,
    ratingColor,
    showNumberUnderIcon,
    lowLabel,
    highLabel,
    handleRatingChange,
  };
}
