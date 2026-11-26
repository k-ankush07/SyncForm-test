
import { useCallback } from "react";


export default function useQuantityField({
  value,
  normalizedElement = {},
  updateValue,
  isReadOnly,
}) {
  // -------------------------------------------------------
  // 1. MINIMUM AND MAXIMUM CONFIGURATION
  // -------------------------------------------------------

  const parsedMin = Number(normalizedElement.minValue);
  const parsedMax = Number(normalizedElement.maxValue);

  const min =
    normalizedElement.setMinValue &&
    normalizedElement.minValue !== "" &&
    Number.isFinite(parsedMin)
      ? parsedMin
      : 0;

  const max =
    normalizedElement.setMaxValue &&
    normalizedElement.maxValue !== "" &&
    Number.isFinite(parsedMax)
      ? Math.max(min, parsedMax)
      : Infinity;

  // -------------------------------------------------------
  // 2. CALCULATE SAFE VALUE
  // -------------------------------------------------------

  const parsedValue = Number(value);

  const currentValue =
    value === "" ||
    value === null ||
    value === undefined ||
    !Number.isFinite(parsedValue)
      ? min
      : parsedValue;

  const safeValue = Math.min(
    max,
    Math.max(min, currentValue)
  );

  // -------------------------------------------------------
  // 3. SHARED VALUE CLAMPING
  // -------------------------------------------------------

  const clampValue = useCallback(
    (number) => {
      return Math.min(max, Math.max(min, number));
    },
    [min, max]
  );

  // -------------------------------------------------------
  // 4. INCREASE QUANTITY
  // -------------------------------------------------------

  const increaseValue = useCallback(() => {
    if (isReadOnly || safeValue >= max) return;

    updateValue(String(clampValue(safeValue + 1)));
  }, [isReadOnly, safeValue, max, clampValue, updateValue]);

  // -------------------------------------------------------
  // 5. DECREASE QUANTITY
  // -------------------------------------------------------

  const decreaseValue = useCallback(() => {
    if (isReadOnly || safeValue <= min) return;

    updateValue(String(clampValue(safeValue - 1)));
  }, [isReadOnly, safeValue, min, clampValue, updateValue]);

  // -------------------------------------------------------
  // 6. HANDLE MANUAL INPUT
  // -------------------------------------------------------

  const handleQuantityChange = useCallback(
    (nextValue) => {
      if (isReadOnly || nextValue === "") return;

      const numericValue = Number(nextValue);

      if (!Number.isFinite(numericValue)) return;

      // Automatically enforce min and max
      const clampedValue = clampValue(numericValue);

      updateValue(String(clampedValue));
    },
    [isReadOnly, clampValue, updateValue]
  );

  return {
    min,
    max,
    safeValue,
    increaseValue,
    decreaseValue,
    handleQuantityChange,
  };
}
