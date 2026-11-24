
import { useState, useEffect, useCallback } from "react";

export default function useCountryField({
  savedValue,
  normalizedElement = {},
  updateValue,
}) {
  // Country search
  const [countrySearch, setCountrySearch] = useState("");

  // Selected country
  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (typeof savedValue === "string") {
      return savedValue;
    }

    return typeof normalizedElement.defaultValue === "string"
      ? normalizedElement.defaultValue
      : "";
  });

  // Country field dropdown (independent from phone dropdown)
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] =
    useState(false);

  // Restore saved country when parent data changes
  useEffect(() => {
    const nextCountry =
      typeof savedValue === "string"
        ? savedValue
        : typeof normalizedElement.defaultValue === "string"
          ? normalizedElement.defaultValue
          : "";

    setSelectedCountry((previous) =>
      previous === nextCountry ? previous : nextCountry
    );

    setCountrySearch("");
    setIsCountryDropdownOpen(false);
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // Select country and notify parent
  const handleCountrySelect = useCallback(
    (country) => {
      setSelectedCountry(country.value);
      updateValue(country.value);
      setIsCountryDropdownOpen(false);
      setCountrySearch("");
    },
    [updateValue]
  );

  return {
    countrySearch,
    setCountrySearch,
    selectedCountry,
    setSelectedCountry,
    isCountryDropdownOpen,
    setIsCountryDropdownOpen,
    handleCountrySelect,
  };
}
