// =====================================================================
// elementValidation.js
//
// Central validation functions for customer-facing form fields.
//
// This file does not render UI.
// It only checks field values and returns validation errors.
// =====================================================================

// Check whether a value is empty.
import {
  isValidPhoneNumber,
  validatePhoneNumberLength,
} from "libphonenumber-js";

export function isEmptyValue(value) {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

// Validate one element.
//
// Returns:
// - null       = field is valid
// - error text = field is invalid

export function validateElement(element, value) {
  if (!element) return null;

  const type = String(element.type || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  const label = element.label || "This field";

  // ---------------------------------------------------
  // 1. REQUIRED VALIDATION
  // ---------------------------------------------------

 const actualValue =
  value && typeof value === "object" && !Array.isArray(value)
    ? type === "email"
      ? value.email
      : type === "password"
        ? value.password
        : type === "phone"
          ? value.number
          : type === "button"
            ? value.value
            : value
    : value;

  if (element.required && isEmptyValue(actualValue)) {
    return element.requiredMessage || `${label} is required.`;
  }

  // Optional empty fields skip further validation.
  //except button fields because they may have minimum selections.
 if (type !== "button" && isEmptyValue(actualValue)) {
  return null;
}

  // ---------------------------------------------------
  // 2. EMAIL FORMAT VALIDATION
  // ---------------------------------------------------

  if (type === "email") {
    const email = String(actualValue).trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    // -------------------------------------------------
    // 3. CONFIRM EMAIL VALIDATION
    // -------------------------------------------------

    if (element.confirmEmail) {
      const confirmEmail =
        typeof value === "object"
          ? String(value.confirmEmail || "").trim()
          : "";

      if (!confirmEmail) {
        return "Please confirm your email address.";
      }

      if (email !== confirmEmail) {
        return "Email addresses do not match.";
      }
    }
  }

  // ---------------------------------------------------
  // 3. NAME VALIDATION
  // ---------------------------------------------------

  if (type === "name" || type === "first_name" || type === "last_name") {
    const name = String(actualValue).trim();

    // Name format validation.
    if (
      element.nameValidation !== false &&
      element.numbersOnly !== true &&
      !/^[a-zA-Z\s'-]+$/.test(name)
    ) {
      return "Please enter a valid name.";
    }

    // Numbers-only validation.
    if (element.numbersOnly === true && !/^[0-9]+$/.test(name)) {
      return "Please enter numbers only.";
    }

    // Minimum character validation.
    if (element.limitCharacters) {
      const minCharacters = Number(element.minCharacters || 0);

      if (minCharacters > 0 && name.length < minCharacters) {
        return `Please enter at least ${minCharacters} characters.`;
      }

      // Maximum character validation.
      const maxCharacters = Number(element.maxCharacters || 0);

      if (maxCharacters > 0 && name.length > maxCharacters) {
        return `Please enter no more than ${maxCharacters} characters.`;
      }
    }
  }

  // ---------------------------------------------------
  // PASSWORD VALIDATION
  // ---------------------------------------------------

  if (type === "password") {
    const password = String(actualValue);

    // ---------------------------------------------------
    // 1. MINIMUM CHARACTER VALIDATION
    // ---------------------------------------------------

    if (element.limitCharacters) {
      const minCharacters = Number(element.minCharacters || 0);

      if (minCharacters > 0 && password.length < minCharacters) {
        return `Password must be at least ${minCharacters} characters long.`;
      }

      // ---------------------------------------------------
      // 2. MAXIMUM CHARACTER VALIDATION
      // ---------------------------------------------------

      const maxCharacters = Number(element.maxCharacters || 0);

      if (maxCharacters > 0 && password.length > maxCharacters) {
        return `Password must be no more than ${maxCharacters} characters long.`;
      }
    }

    // ---------------------------------------------------
    // 3. PASSWORD FORMAT VALIDATION
    // ---------------------------------------------------

    const validationRule = element.passwordValidation || "none";

    if (validationRule !== "none") {
      let regex;

      try {
        regex =
          validationRule === "advancedValidateRule"
            ? element.advancedPasswordValidation
            : validationRule;

        if (regex) {
          const passwordPattern = new RegExp(regex);

          if (!passwordPattern.test(password)) {
            // Minimum 6 characters
            if (validationRule === "^.{6,}$") {
              return "Password must be at least 6 characters long.";
            }

            // At least one letter and one number
            if (validationRule === "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$") {
              if (password.length < 6) {
                return "Password must be at least 6 characters long.";
              }

              if (!/[A-Za-z]/.test(password)) {
                return "Password must contain at least one letter.";
              }

              if (!/\d/.test(password)) {
                return "Password must contain at least one number.";
              }

              return "Password must contain only letters and numbers.";
            }

            // Letter, number and special character
            if (
              validationRule ===
              "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{6,}$"
            ) {
              if (password.length < 6) {
                return "Password must be at least 6 characters long.";
              }

              if (!/[A-Za-z]/.test(password)) {
                return "Password must contain at least one letter.";
              }

              if (!/\d/.test(password)) {
                return "Password must contain at least one number.";
              }

              if (!/[@$!%*#?&]/.test(password)) {
                return "Password must contain at least one special character.";
              }

              return "Password contains unsupported characters.";
            }

            // Uppercase, lowercase and number
            if (
              validationRule ===
              "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$"
            ) {
              if (password.length < 6) {
                return "Password must be at least 6 characters long.";
              }

              if (!/[A-Z]/.test(password)) {
                return "Password must contain at least one uppercase letter.";
              }

              if (!/[a-z]/.test(password)) {
                return "Password must contain at least one lowercase letter.";
              }

              if (!/\d/.test(password)) {
                return "Password must contain at least one number.";
              }

              return "Password must contain only letters and numbers.";
            }

            // Uppercase, lowercase, number and special character
            if (
              validationRule ===
              "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$"
            ) {
              if (password.length < 6) {
                return "Password must be at least 6 characters long.";
              }

              if (!/[A-Z]/.test(password)) {
                return "Password must contain at least one uppercase letter.";
              }

              if (!/[a-z]/.test(password)) {
                return "Password must contain at least one lowercase letter.";
              }

              if (!/\d/.test(password)) {
                return "Password must contain at least one number.";
              }

              if (!/[@$!%*?&]/.test(password)) {
                return "Password must contain at least one special character.";
              }

              return "Password contains unsupported characters.";
            }

            // Advanced regex
            return "Password does not meet your custom validation requirements.";
          }
        }
      } catch (error) {
        return "Invalid password validation rule. Please check your regex.";
      }
    }

    // ---------------------------------------------------
    // 4. CONFIRM PASSWORD VALIDATION
    // ---------------------------------------------------

    if (element.confirmPassword) {
      const confirmPassword =
        typeof value === "object" ? String(value.confirmPassword || "") : "";

      if (!confirmPassword) {
        return "Please confirm your password.";
      }

      if (password !== confirmPassword) {
        return "Passwords do not match.";
      }
    }
  }

  // ---------------------------------------------------
  // PHONE VALIDATION
  // ---------------------------------------------------

  if (type === "phone") {
    const phoneNumber = String(actualValue || "").trim();

    // Required validation has already handled empty values.
    if (!phoneNumber) {
      return null;
    }

    // Only validate the phone format when international
    // telephone validation is enabled.
    if (
      element.phoneValidation !== false &&
      element.showCountryCode === false
    ) {
      const countryCode =
        typeof value === "object"
          ? String(value.country || "").toUpperCase()
          : "";

      const dialCode =
        typeof value === "object" ? String(value.dialCode || "") : "";

      const fullNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : phoneNumber.startsWith("00")
          ? `+${phoneNumber.slice(2)}`
          : `${dialCode}${phoneNumber}`;

      if (!isValidPhoneNumber(fullNumber)) {
        const lengthError = validatePhoneNumberLength(
          fullNumber,
          countryCode || undefined,
        );

        switch (lengthError) {
          case "TOO_SHORT":
            return "Phone number is too short.";

          case "TOO_LONG":
            return "Phone number is too long.";

          case "INVALID_LENGTH":
            return "Please enter a valid phone number length.";

          case "NOT_A_NUMBER":
            return "Please enter a valid phone number.";

          case "INVALID_COUNTRY":
            return "Please select a valid country.";

          default:
            return "Please enter a valid phone number.";
        }
      }
    }
  }

  // ---------------------------------------------------
// BUTTON VALIDATION
// ---------------------------------------------------

if (type === "button") {
  const buttonValue =
    typeof value === "object" && !Array.isArray(value)
      ? value.value
      : value;

  const selectedOptions = Array.isArray(buttonValue)
    ? buttonValue
    : buttonValue
      ? [buttonValue]
      : [];

  // Check whether Other was selected.
  const otherSelected = selectedOptions.includes("__other__");

  // Require custom text when a required button field
  // has the Other option selected.
  if (
    element.required &&
    otherSelected &&
    !String(value?.otherValue || "").trim()
  ) {
    return "Please specify your Other answer.";
  }

  // Validate selection limits.
  const limitEnabled =
    element.multipleOptions && element.limitSelections;

  if (limitEnabled) {
    const min = Math.max(0, Number(element.minSelections ?? 0));
    const max = Number(element.maxSelections ?? 10);

    if (selectedOptions.length < min) {
      return `Please select at least ${min} options.`;
    }

    if (max > 0 && selectedOptions.length > max) {
      return `Please select no more than ${max} options.`;
    }
  }
}

  // ---------------------------------------------------
  // TEXT VALIDATION
  // ---------------------------------------------------

  if (type === "text") {
    const text = String(actualValue).trim();

    // Maximum character validation.
    if (element.enableCharacterLimit) {
      const maxLength = Number(element.maxLength || 0);

      if (maxLength > 0 && text.length > maxLength) {
        return `Please enter no more than ${maxLength} characters.`;
      }
    }

    // Numbers-only validation.
    if (element.numbersOnly === true && !/^[0-9]+$/.test(text)) {
      return "Please enter numbers only.";
    }

    // Name validation.
    if (
      element.nameValidation === true &&
      element.numbersOnly !== true &&
      !/^[a-zA-Z\s'-]+$/.test(text)
    ) {
      return "Please enter a valid name.";
    }
  }

    // ---------------------------------------------------
  // TEXTAREA VALIDATION
  // ---------------------------------------------------

  if (type === "textarea") {
    const text = String(actualValue);

    if (element.limitCharacters) {
      // Minimum character validation.
      const minCharacters = Number(element.minCharacters || 0);

      if (minCharacters > 0 && text.length < minCharacters) {
        return `Please enter at least ${minCharacters} characters.`;
      }

      // Maximum character validation.
      const maxLength = Number(element.maxLength || 0);

      if (maxLength > 0 && text.length > maxLength) {
        return `Please enter no more than ${maxLength} characters.`;
      }
    }
  }

// Optional empty fields skip further validation.
if (isEmptyValue(actualValue)) {
  return null;
}

  return null;
}
