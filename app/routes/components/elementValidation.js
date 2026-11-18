
// =====================================================================
// elementValidation.js
//
// Central validation functions for customer-facing form fields.
//
// This file does not render UI.
// It only checks field values and returns validation errors.
// =====================================================================


// Check whether a value is empty.
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
  if (!element) {
    return null;
  }

  const type = String(element.type || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  const label = element.label || "This field";

  // ---------------------------------------------------
  // 1. REQUIRED VALIDATION
  // ---------------------------------------------------

  if (element.required && isEmptyValue(value)) {
    return (
      element.requiredMessage ||
      `${label} is required.`
    );
  }

  // Optional empty fields do not need further validation.
  if (isEmptyValue(value)) {
    return null;
  }

  // ---------------------------------------------------
  // 2. FIELD-SPECIFIC VALIDATION
  // We will add the individual rules in the next steps.
  // ---------------------------------------------------

  return null;
}
