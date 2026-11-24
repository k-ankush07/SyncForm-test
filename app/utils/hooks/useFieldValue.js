
import { useState, useEffect, useCallback } from "react";

import {
  getSavedTextValue,
  getSavedSelection,
  getSavedOtherValue,
} from "../fieldValueHelpers.js";

export default function useFieldValue({
  savedValue,
  defaultValue,
  fieldId,
  onChange,
  normalizedElement = {},
  enableSelection = false,
}) {
  // Text input state
  const [value, setValue] = useState(() =>
    getSavedTextValue(savedValue, defaultValue)
  );

  // Shared selection state
  const [selected, setSelected] = useState(() =>
    getSavedSelection(savedValue, normalizedElement)
  );

  // Shared "Other" input state
  const [otherValue, setOtherValue] = useState(() =>
    getSavedOtherValue(savedValue, normalizedElement)
  );

  // Notify parent
  const reportChange = useCallback(
    (nextValue) => {
      if (fieldId == null) return;

      onChange?.(fieldId, nextValue);
    },
    [fieldId, onChange]
  );

  // Update text input and notify parent
  const updateValue = useCallback(
    (nextValue) => {
      setValue(nextValue);
      reportChange(nextValue);
    },
    [reportChange]
  );

  // Sync text input
  useEffect(() => {
    const nextTextValue = getSavedTextValue(
      savedValue,
      defaultValue
    );

    setValue((previous) =>
      previous === nextTextValue ? previous : nextTextValue
    );
  }, [savedValue, defaultValue, fieldId]);

  // Sync shared selection and Other value
  useEffect(() => {
    if (!enableSelection) return;

    const nextSelection = getSavedSelection(
      savedValue,
      normalizedElement
    );

    const nextOtherValue = getSavedOtherValue(
      savedValue,
      normalizedElement
    );

    setSelected((previous) =>
      JSON.stringify(previous) === JSON.stringify(nextSelection)
        ? previous
        : nextSelection
    );

    setOtherValue((previous) =>
      previous === nextOtherValue ? previous : nextOtherValue
    );
  }, [
    enableSelection,
    savedValue,
    normalizedElement.id,
    normalizedElement.defaultValue,
    normalizedElement.otherValue,
    fieldId,
  ]);

  return {
    value,
    setValue,
    reportChange,
    updateValue,

    selected,
    setSelected,

    otherValue,
    setOtherValue,
  };
}
