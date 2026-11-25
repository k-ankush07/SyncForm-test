
import { useState, useEffect, useMemo, useCallback } from "react";

export default function useDropdownField({
  normalizedElement = {},
  value,
  updateValue,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  // Normalize dropdown options.
  const dropdownOptions = useMemo(
    () =>
      (normalizedElement.options || []).map((option) => ({
        label:
          typeof option === "string"
            ? option
            : option.label || option.value,
        value:
          typeof option === "string"
            ? option
            : option.value || option.label,
      })),
    [normalizedElement.options]
  );

  // Find selected option.
  const selectedOption = dropdownOptions.find(
    (option) => option.value === value
  );

  // Filter options for search.
  const filteredOptions = useMemo(
    () =>
      dropdownOptions.filter((option) =>
        String(option.label || "")
          .toLowerCase()
          .includes(dropdownSearch.toLowerCase())
      ),
    [dropdownOptions, dropdownSearch]
  );

  // Handle option selection.
  const handleDropdownSelect = useCallback(
    (option) => {
      updateValue(option.value);
      setDropdownOpen(false);
      setDropdownSearch("");
    },
    [updateValue]
  );

  // Reset dropdown when switching fields.
  useEffect(() => {
    setDropdownOpen(false);
    setDropdownSearch("");
  }, [normalizedElement.id]);

  return {
    dropdownOpen,
    setDropdownOpen,
    dropdownSearch,
    setDropdownSearch,
    dropdownOptions,
    selectedOption,
    filteredOptions,
    handleDropdownSelect,
  };
}
