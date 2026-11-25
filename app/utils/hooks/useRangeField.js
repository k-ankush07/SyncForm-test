
import { useState, useEffect, useCallback } from "react";

export default function useRangeField({
  savedValue,
  normalizedElement = {},
  reportChange,
}) {
  // 1. Range configuration
  const min = Number(normalizedElement.min ?? 0);
  const max = Number(normalizedElement.max ?? 100);

  const step = Math.max(
    0.000001,
    Number(normalizedElement.step) || 1
  );

  const showRangeValue =
    normalizedElement.showRangeValue !== false;

  // 2. Initial or restored value
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
    min,
    max,
    normalizedElement.defaultValue,
  ]);

  const [rangeValue, setRangeValue] = useState(getRangeValue);

  // 3. Synchronize when field configuration changes
  useEffect(() => {
    const nextValue = getRangeValue();

    setRangeValue((previous) =>
      previous === nextValue ? previous : nextValue
    );
  }, [normalizedElement.id, getRangeValue]);

  // 4. Handle slider changes
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
    rangeMin: min,
    rangeMax: max,
    rangeStep: step,
    showRangeValue,
    handleRangeChange,
  };
}
