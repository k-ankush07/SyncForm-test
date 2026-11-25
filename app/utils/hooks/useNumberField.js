import { useState, useCallback } from "react";

export default function useNumberField({
  normalizedElement = {},
  updateValue,
}) {
  // Get min and max limits.
  const min = normalizedElement.setMinValue
    ? Number(normalizedElement.minValue)
    : undefined;

  const max = normalizedElement.setMaxValue
    ? Number(normalizedElement.maxValue)
    : undefined;

  const [numberError, setNumberError] = useState("");

  // Handle number input changes.
  const handleNumberChangeWithLimits = useCallback(
    (nextValue) => {
      if (nextValue === "") {
        updateValue("");
        setNumberError("");
        return;
      }

      const numericValue = Number(nextValue);

      if (!Number.isFinite(numericValue)) return;

      if (min !== undefined && numericValue < min) {
        updateValue(String(min));
      } else if (max !== undefined && numericValue > max) {
        updateValue(String(max));
      } else {
        updateValue(nextValue);
      }

      setNumberError("");
    },
    [min, max, updateValue]
  );

  return {
    numberError,
    handleNumberChangeWithLimits,
  };
}