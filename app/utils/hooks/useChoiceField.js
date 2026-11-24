
import { useCallback } from "react";

export default function useChoiceField({
  selected,
  setSelected,
  otherValue,
  setOtherValue,
  reportChange,
  maxSelections = 0,
}) {
  // CHECKBOX: Add or remove an option
  const handleCheckboxChange = useCallback(
    (optionValue, isChecked) => {
      let updated = [...selected];

      if (isChecked) {
        if (
          maxSelections > 0 &&
          updated.length >= maxSelections
        ) {
          return;
        }

        updated.push(optionValue);
      } else {
        updated = updated.filter(
          (value) => value !== optionValue
        );
      }

      setSelected(updated);
      reportChange(updated);
    },
    [selected, setSelected, reportChange, maxSelections]
  );

  // RADIO: Select one option
  const handleRadioChange = useCallback(
    (optionValue) => {
      setSelected([optionValue]);
      setOtherValue("");

      reportChange(optionValue);
    },
    [setSelected, setOtherValue, reportChange]
  );

  // OTHER: Checkbox
  const handleCheckboxOtherChange = useCallback(
    (isChecked) => {
      let updated = [...selected];

      if (isChecked) {
        if (
          maxSelections > 0 &&
          updated.length >= maxSelections
        ) {
          return;
        }

        updated.push("__other__");
      } else {
        updated = updated.filter(
          (value) => value !== "__other__"
        );
      }

      setSelected(updated);

      const nextOtherValue = isChecked ? otherValue : "";

      if (!isChecked) {
        setOtherValue("");
      }

      reportChange({
        value: updated,
        otherValue: nextOtherValue,
      });
    },
    [
      selected,
      setSelected,
      otherValue,
      setOtherValue,
      reportChange,
      maxSelections,
    ]
  );

  // OTHER: Radio
  const handleRadioOtherChange = useCallback(() => {
    setSelected(["__other__"]);

    reportChange({
      value: "__other__",
      otherValue,
    });
  }, [setSelected, otherValue, reportChange]);

  // OTHER: Text input
  const handleOtherTextChange = useCallback(
    (newValue, isRadio = false) => {
      setOtherValue(newValue);

      reportChange(
        isRadio
          ? {
              value: "__other__",
              otherValue: newValue,
            }
          : {
              value: selected,
              otherValue: newValue,
            }
      );
    },
    [selected, setOtherValue, reportChange]
  );

  return {
    handleCheckboxChange,
    handleRadioChange,
    handleCheckboxOtherChange,
    handleRadioOtherChange,
    handleOtherTextChange,
  };
}
