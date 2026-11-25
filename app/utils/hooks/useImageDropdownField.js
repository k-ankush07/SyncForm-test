
import { useState, useEffect, useMemo, useCallback } from "react";

export default function useImageDropdownField({
  normalizedElement = {},
  rawOptions = [],
  value,
  updateValue,
  isReadOnly,
}) {
  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);

  // Get options containing images.
  const imageOptions = useMemo(
    () =>
      rawOptions.filter(
        (option) =>
          typeof option === "object" && option?.image
      ),
    [rawOptions]
  );

  // Find selected image option.
  const selectedImageOption = imageOptions.find(
    (option) => (option.value || option.label) === value
  );

  // Handle image option selection.
  const handleImageDropdownSelect = useCallback(
    (option) => {
      if (isReadOnly) return;

      const optionValue = option.value || option.label;

      updateValue(optionValue);
      setImageDropdownOpen(false);
    },
    [isReadOnly, updateValue]
  );

  // Reset when switching fields.
  useEffect(() => {
    setImageDropdownOpen(false);
  }, [normalizedElement.id]);

  return {
    imageOptions,
    selectedImageOption,
    imageDropdownOpen,
    setImageDropdownOpen,
    handleImageDropdownSelect,
  };
}
