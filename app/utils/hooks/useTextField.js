
import { useCallback, useMemo } from "react";

export default function useTextField({
  normalizedElement = {},
  value,
  setValue,
  reportChange,
  fieldType = "text",
}) {
  const isTextarea = fieldType === "textarea";

  // TEXT configuration
  const maxLength = Number(normalizedElement.maxLength ?? 100);
  const hasTextCharacterLimit =
    normalizedElement.enableCharacterLimit === true;

  const numbersOnly = normalizedElement.numbersOnly === true;
  const nameValidation = normalizedElement.nameValidation === true;

  // TEXTAREA configuration
  const minCharacters = Number(normalizedElement.minCharacters || 0);
  const maxCharacters = Number(normalizedElement.maxCharacters || 0);

  const hasTextareaCharacterLimit =
    normalizedElement.limitCharacters === true;

  const effectiveMaxLength = isTextarea
    ? maxCharacters
    : maxLength;

  const hasCharacterLimit = isTextarea
    ? hasTextareaCharacterLimit
    : hasTextCharacterLimit;

  const characterCount = (value || "").length;

  const handleTextChange = useCallback(
    (newValue) => {
      let updatedValue = newValue;

      // Text-only filtering
      if (!isTextarea) {
        if (numbersOnly) {
          updatedValue = updatedValue.replace(/[^0-9]/g, "");
        }

        if (nameValidation) {
          updatedValue = updatedValue.replace(
            /[^\p{L}\p{M}\s'.-]/gu,
            ""
          );
        }
      }

      // Maximum character limit
      if (hasCharacterLimit && effectiveMaxLength > 0) {
        updatedValue = updatedValue.slice(0, effectiveMaxLength);
      }

      setValue(updatedValue);
      reportChange(updatedValue);
    },
    [
      isTextarea,
      numbersOnly,
      nameValidation,
      hasCharacterLimit,
      effectiveMaxLength,
      setValue,
      reportChange,
    ]
  );

  return {
    handleTextChange,
    characterCount,
    maxLength: effectiveMaxLength,
    hasCharacterLimit,
  };
}
