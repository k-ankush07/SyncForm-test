
import { useState, useEffect, useCallback } from "react";

export default function useBooleanField({
  savedValue,
  normalizedElement = {},
  type,
  reportChange,
}) {
  const getSavedCheckedValue = () => {
    if (typeof savedValue === "boolean") {
      return savedValue;
    }

    return type === "consent"
      ? normalizedElement.checkedByDefault ?? true
      : Boolean(normalizedElement.defaultValue);
  };

const getSavedSwitchValue = () => {
  if (typeof savedValue === "boolean") {
    return savedValue;
  }

  return Boolean(
    normalizedElement.defaultChecked ??
    normalizedElement.defaultValue ??
    false
  );
};

  const [checked, setChecked] = useState(getSavedCheckedValue);
  const [switchValue, setSwitchValue] = useState(getSavedSwitchValue);

  useEffect(() => {
    const nextChecked = getSavedCheckedValue();

    setChecked((previous) =>
      previous === nextChecked ? previous : nextChecked
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    normalizedElement.checkedByDefault,
    savedValue,
    type,
  ]);

  useEffect(() => {
    const nextValue = getSavedSwitchValue();

    setSwitchValue((previous) =>
      previous === nextValue ? previous : nextValue
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultChecked,
    savedValue,
  ]);

  const handleSwitchChange = useCallback(() => {
    setSwitchValue((previous) => {
      const nextValue = !previous;
      reportChange(nextValue);
      return nextValue;
    });
  }, [reportChange]);

  return {
    checked,
    setChecked,
    switchValue,
    setSwitchValue,
    handleSwitchChange,
  };
}
