
import { useState, useEffect, useCallback } from "react";

export default function useEmailField({
  savedValue,
  normalizedElement = {},
  value,
  setValue,
  reportChange,
}) {
  // Get the saved confirm-email value.
  const getSavedConfirmEmail = () =>
    savedValue && typeof savedValue === "object"
      ? savedValue.confirmEmail ?? ""
      : "";

  const [confirmEmailValue, setConfirmEmailValue] = useState(
    getSavedConfirmEmail
  );

  // Synchronize confirm email when the parent restores saved data.
  useEffect(() => {
    const nextValue = getSavedConfirmEmail();

    setConfirmEmailValue((previous) =>
      previous === nextValue ? previous : nextValue
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // Update the main email and report both values to the parent.
  const handleEmailChange = useCallback(
    (nextValue) => {
      setValue(nextValue);

      reportChange({
        email: nextValue,
        confirmEmail: confirmEmailValue,
      });
    },
    [setValue, reportChange, confirmEmailValue]
  );

  // Update confirm email and report both values to the parent.
  const handleConfirmEmailChange = useCallback(
    (nextValue) => {
      setConfirmEmailValue(nextValue);

      reportChange({
        email: value,
        confirmEmail: nextValue,
      });
    },
    [value, reportChange]
  );

  return {
    confirmEmailValue,
    handleEmailChange,
    handleConfirmEmailChange,
  };
}
