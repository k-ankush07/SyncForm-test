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