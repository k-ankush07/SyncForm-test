
// Convert the parent's saved value into the text displayed by inputs.
// Some field types save objects rather than plain strings.
export function getSavedTextValue(savedValue, defaultValue = "") {
  if (savedValue === undefined || savedValue === null) {
    return String(defaultValue ?? "");
  }

  if (typeof savedValue === "object" && !Array.isArray(savedValue)) {
    if ("email" in savedValue) {
      return String(savedValue.email ?? "");
    }

    if ("password" in savedValue) {
      return String(savedValue.password ?? "");
    }

    if ("number" in savedValue) {
      return String(savedValue.number ?? "");
    }

    return String(defaultValue ?? "");
  }

  if (Array.isArray(savedValue)) {
    return "";
  }

  return String(savedValue);
}

// Helpers for choice fields.
export const getSavedSelection = (savedValue, normalizedElement = {}) => {
  if (savedValue !== undefined && savedValue !== null) {
    if (Array.isArray(savedValue)) {
      return savedValue;
    }

    if (typeof savedValue === "string") {
      return savedValue ? [savedValue] : [];
    }

    if (
      typeof savedValue === "object" &&
      savedValue.value !== undefined
    ) {
      if (Array.isArray(savedValue.value)) {
        return savedValue.value;
      }

      return savedValue.value ? [savedValue.value] : [];
    }
  }

  return normalizedElement.defaultValue
    ? [normalizedElement.defaultValue]
    : [];
};

export const getSavedOtherValue = (savedValue, normalizedElement = {}) => {
  if (
    savedValue &&
    typeof savedValue === "object" &&
    !Array.isArray(savedValue)
  ) {
    return savedValue.otherValue || "";
  }

  return normalizedElement.otherValue || "";
};
