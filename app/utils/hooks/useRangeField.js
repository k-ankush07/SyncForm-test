
import { useState, useEffect, useCallback } from "react";

export default function useRangeField({
  savedValue,
  normalizedElement = {},
  reportChange,
}) {
  const min = Number(normalizedElement.min ?? 0);
  const max = Number(normalizedElement.max ?? 100);

  const step = Math.max(
    0.000001,
    Number(normalizedElement.step) || 1
  );

  // Get the initial or restored range value.
  const getRangeValue = useCallback(() => {
    const initialValue =
      savedValue !== undefined && savedValue !== null
        ? Number(savedValue)
        : Number(normalizedElement.defaultValue);

    return Number.isFinite(initialValue)
      ? Math.min(max, Math.max(min, initialValue))
      : min;
  }, [
    savedValue,
    normalizedElement.min,
    normalizedElement.max,
    normalizedElement.defaultValue,
  ]);

  const [rangeValue, setRangeValue] = useState(getRangeValue);

  // Synchronize when the field or its saved configuration changes.
  useEffect(() => {
    const nextValue = getRangeValue();

    setRangeValue((previous) =>
      previous === nextValue ? previous : nextValue
    );
  }, [normalizedElement.id, getRangeValue]);

  // Update the range and notify the parent.
  const handleRangeChange = useCallback(
    (nextValue) => {
      const numericValue = Number(nextValue);

      const updatedValue = Number.isFinite(numericValue)
        ? Math.min(max, Math.max(min, numericValue))
        : min;

      setRangeValue(updatedValue);
      reportChange(updatedValue);
    },
    [min, max, reportChange]
  );

  return {
    rangeValue,
    min,
    max,
    step,
    handleRangeChange,
  };
}
