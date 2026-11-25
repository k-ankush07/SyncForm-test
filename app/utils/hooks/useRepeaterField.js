
import { useState, useEffect, useCallback } from "react";

export default function useRepeaterField({
  savedValue,
  normalizedElement = {},
  reportChange,
  isReadOnly = false,
}) {
  const fieldId = normalizedElement.id;

  // Normalize repeater values into an array
  const getInitialRepeaterItems = () => {
    if (Array.isArray(savedValue)) {
      return savedValue;
    }

    if (
      savedValue !== undefined &&
      savedValue !== null &&
      savedValue !== ""
    ) {
      return [String(savedValue)];
    }

    return [""];
  };

  const [items, setItems] = useState(getInitialRepeaterItems);

  // Synchronize when saved data or field changes
  useEffect(() => {
    const nextItems = getInitialRepeaterItems();

    setItems((previous) =>
      JSON.stringify(previous) === JSON.stringify(nextItems)
        ? previous
        : nextItems
    );
  }, [fieldId, savedValue]);

  // Calculate minimum and maximum item limits
  const parsedMin = Number(normalizedElement.minItems);
  const parsedMax = Number(normalizedElement.maxItems);

  const minItems =
    normalizedElement.minItems !== undefined &&
    normalizedElement.minItems !== "" &&
    Number.isFinite(parsedMin)
      ? Math.max(1, Math.floor(parsedMin))
      : 1;

  const maxItems =
    normalizedElement.maxItems !== undefined &&
    normalizedElement.maxItems !== "" &&
    Number.isFinite(parsedMax)
      ? Math.max(minItems, Math.floor(parsedMax))
      : Math.max(5, minItems);

  // Update local state and notify parent
  const updateRepeaterValue = useCallback(
    (nextItems) => {
      setItems(nextItems);
      reportChange(nextItems);
    },
    [reportChange]
  );

  // Add an item
  const handleAddItem = useCallback(() => {
    if (isReadOnly || items.length >= maxItems) return;

    updateRepeaterValue([...items, ""]);
  }, [isReadOnly, items, maxItems, updateRepeaterValue]);

  // Remove an item
  const handleRemoveItem = useCallback(
    (index) => {
      if (isReadOnly || items.length <= minItems) return;

      const updatedItems = items.filter(
        (_, itemIndex) => itemIndex !== index
      );

      updateRepeaterValue(updatedItems);
    },
    [isReadOnly, items, minItems, updateRepeaterValue]
  );

  // Update an item
  const handleItemChange = useCallback(
    (index, newValue) => {
      if (isReadOnly) return;

      const updatedItems = [...items];
      updatedItems[index] = newValue;

      updateRepeaterValue(updatedItems);
    },
    [isReadOnly, items, updateRepeaterValue]
  );

  // Minimum item validation
  const filledItemsCount = items.filter(
    (item) => String(item ?? "").trim() !== ""
  ).length;

  const hasMinItemsError = filledItemsCount < minItems;

  return {
    items,
    minItems,
    maxItems,
    hasMinItemsError,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
  };
}
