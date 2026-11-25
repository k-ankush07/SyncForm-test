
import { useState, useCallback } from "react";

export default function useNameField({
  normalizedElement = {},
  updateValue,
  isValidName,
  filterNumbersOnly,
}) {
  const [nameError, setNameError] = useState("");

  const handleNameChange = useCallback(
    (newValue) => {
      const input = String(newValue ?? "");

      // Numbers only
      if (normalizedElement.numbersOnly) {
        updateValue(filterNumbersOnly(input));
        setNameError("");
        return;
      }

      updateValue(input);

      // Name validation
      if (normalizedElement.nameValidation !== false && input) {
        setNameError(
          isValidName(input)
            ? ""
            : "Please enter a valid name."
        );
        return;
      }

      setNameError("");
    },
    [
      normalizedElement.numbersOnly,
      normalizedElement.nameValidation,
      updateValue,
      filterNumbersOnly,
      isValidName,
    ]
  );

  return {
    nameError,
    handleNameChange,
  };
}
