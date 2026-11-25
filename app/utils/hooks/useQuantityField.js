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
    normalizedElement.setMinValue && Number.isFinite(parsedMin)
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

  const safeValue = Math.min(max, Math.max(min, currentValue));

  // -------------------------------------------------------
  // 3. INCREASE QUANTITY
  // -------------------------------------------------------

  const increaseValue = useCallback(() => {
    if (isReadOnly || safeValue >= max) return;

    updateValue(String(Math.min(max, safeValue + 1)));
  }, [isReadOnly, safeValue, max, updateValue]);

  // -------------------------------------------------------
  // 4. DECREASE QUANTITY
  // -------------------------------------------------------

  const decreaseValue = useCallback(() => {
    if (isReadOnly || safeValue <= min) return;

    updateValue(String(Math.max(min, safeValue - 1)));
  }, [isReadOnly, safeValue, min, updateValue]);

  return {
    min,
    max,
    safeValue,
    increaseValue,
    decreaseValue,
  };
}