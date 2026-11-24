
import { useState, useEffect } from "react";

export default function usePasswordField({
  savedValue,
  fieldId,
}) {
  const [confirmPasswordValue, setConfirmPasswordValue] = useState(
    () =>
      savedValue && typeof savedValue === "object"
        ? savedValue.confirmPassword ?? ""
        : ""
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordValidationTriggered, setPasswordValidationTriggered] =
    useState(false);

  // Reset when switching to another field.
  useEffect(() => {
    const nextConfirmPassword =
      savedValue && typeof savedValue === "object"
        ? savedValue.confirmPassword ?? ""
        : "";

    setConfirmPasswordValue(nextConfirmPassword);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordValidationTriggered(false);
  }, [fieldId]);

  return {
    confirmPasswordValue,
    setConfirmPasswordValue,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordValidationTriggered,
    setPasswordValidationTriggered,
  };
}
