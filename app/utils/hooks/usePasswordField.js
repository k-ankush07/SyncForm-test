
import { useState, useEffect } from "react";

export default function usePasswordField({
  savedValue,
  fieldId,
  value,
  setValue,
  reportChange,
  normalizedElement = {},
  required = false,
  label = "Password",
}) {
  // ===========================================================
  // CONFIRM PASSWORD STATE
  // ===========================================================

  const savedConfirmPassword =
    savedValue && typeof savedValue === "object"
      ? savedValue.confirmPassword ?? ""
      : "";

  const [confirmPasswordValue, setConfirmPasswordValue] = useState(
    savedConfirmPassword
  );

  // Synchronize restored confirm-password data.
  useEffect(() => {
    setConfirmPasswordValue((previous) =>
      previous === savedConfirmPassword
        ? previous
        : savedConfirmPassword
    );
  }, [fieldId, savedConfirmPassword]);

  // ===========================================================
  // PASSWORD VISIBILITY STATE
  // ===========================================================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset visibility when switching fields.
  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [fieldId]);

  // ===========================================================
  // VALIDATION STATE
  // ===========================================================

  const [passwordValidationTriggered, setPasswordValidationTriggered] =
    useState(false);

  useEffect(() => {
    setPasswordValidationTriggered(false);
  }, [fieldId]);

  // ===========================================================
  // PASSWORD CHANGE HANDLERS
  // ===========================================================

  const handlePasswordChange = (nextValue) => {
    setValue(nextValue);

    reportChange(
      normalizedElement.confirmPassword
        ? {
            password: nextValue,
            confirmPassword: confirmPasswordValue,
          }
        : nextValue
    );
  };

  const handleConfirmPasswordChange = (nextValue) => {
    setConfirmPasswordValue(nextValue);

    reportChange({
      password: value,
      confirmPassword: nextValue,
    });
  };

  // ===========================================================
  // PASSWORD VALIDATION
  // ===========================================================

  const getPasswordError = () => {
    const password = String(value || "");

    if (required && !password.trim()) {
      return `${label} is required.`;
    }

    if (normalizedElement.limitCharacters) {
      const min =
        normalizedElement.minCharacters !== ""
          ? Number(normalizedElement.minCharacters)
          : null;

      const max =
        normalizedElement.maxCharacters !== ""
          ? Number(normalizedElement.maxCharacters)
          : null;

      if (min !== null && password.length < min) {
        return `Password must contain at least ${min} characters.`;
      }

      if (max !== null && password.length > max) {
        return `Password cannot exceed ${max} characters.`;
      }
    }

    const validationRule = normalizedElement.passwordValidation;

    if (validationRule && validationRule !== "none") {
      const regexString =
        validationRule === "advancedValidateRule"
          ? normalizedElement.advancedPasswordValidation
          : validationRule;

      if (regexString) {
        try {
          const regex = new RegExp(regexString);

          if (!regex.test(password)) {
            return "Password does not meet the required conditions.";
          }
        } catch {
          return "The password validation rule is invalid.";
        }
      }
    }

    if (
      normalizedElement.confirmPassword &&
      password !== confirmPasswordValue
    ) {
      return "Passwords do not match.";
    }

    return "";
  };

  const passwordError = passwordValidationTriggered
    ? getPasswordError()
    : "";

  const confirmPasswordError =
    passwordValidationTriggered &&
    normalizedElement.confirmPassword &&
    String(value || "") !== String(confirmPasswordValue || "")
      ? "Passwords do not match."
      : "";

  return {
    confirmPasswordValue,
    setConfirmPasswordValue,

    showPassword,
    setShowPassword,

    showConfirmPassword,
    setShowConfirmPassword,

    passwordValidationTriggered,
    setPasswordValidationTriggered,

    handlePasswordChange,
    handleConfirmPasswordChange,

    passwordError,
    confirmPasswordError,
  };
}
