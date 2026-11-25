
import { useCallback, useMemo } from "react";

const FEEDBACK_STYLES = {
  experience: ["😡", "🙁", "😐", "🙂", "😍"],
  satisfaction: ["😞", "😕", "😐", "😊", "🤩"],
  agreement: ["👎", "🙅", "🤷", "👍", "💯"],
  effort: ["😫", "😓", "😐", "😌", "💪"],
  likelihood: ["🚫", "🙁", "🤔", "🙂", "🚀"],
};

export default function useChoiceField({
  selected,
  setSelected,
  otherValue,
  setOtherValue,
  reportChange,
  normalizedElement = {},
  maxSelections = 0,
  isReadOnly = false,
}) {
  // ===========================================================
  // 1. NORMALIZE OPTIONS
  // ===========================================================

  const options = useMemo(() => {
    const rawOptions = Array.isArray(normalizedElement.options)
      ? normalizedElement.options
      : [];

    return rawOptions.map((option, index) => {
      if (typeof option === "string") {
        return {
          label: option,
          value: option,
        };
      }

      return {
        label: option?.label || option?.value || `Option ${index + 1}`,
        value: option?.value || option?.label || `option-${index + 1}`,
      };
    });
  }, [normalizedElement.options]);

  // ===========================================================
  // 2. NORMALIZE SELECTED VALUES
  // ===========================================================

  const selectedValues = Array.isArray(selected)
    ? selected
    : selected
      ? [selected]
      : [];

  // ===========================================================
  // 3. SELECTION LIMITS
  // ===========================================================

  const minSelections = Math.max(
    0,
    Number(normalizedElement.minSelections) || 0
  );

  const effectiveMaxSelections = Math.max(
    0,
    Number(maxSelections || normalizedElement.maxSelections) || 0
  );

  const isMaxReached =
    effectiveMaxSelections > 0 &&
    selectedValues.length >= effectiveMaxSelections;

  const hasMinimumSelections =
    selectedValues.filter((item) => item !== "__other__").length >=
    minSelections;

  // ===========================================================
  // 4. GRID CONFIGURATION
  // ===========================================================

  const optionsPerLine = Math.min(
    5,
    Math.max(1, Number(normalizedElement.optionsPerLine) || 1)
  );

  const columnWidth = String(normalizedElement.columnWidth);

  const checkboxColumns =
    columnWidth === "33"
      ? 2
      : columnWidth === "50"
        ? 3
        : optionsPerLine;

  const choiceGridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: `repeat(${checkboxColumns}, minmax(0, 1fr))`,
      gap: "12px",
      width: "100%",
    }),
    [checkboxColumns]
  );

  // ===========================================================
  // 5. CHECKBOX HANDLERS
  // ===========================================================

  const handleCheckboxChange = useCallback(
    (optionValue, isChecked) => {
      if (isReadOnly) return;

      let updated = [...selectedValues];

      if (isChecked) {
        if (
          effectiveMaxSelections > 0 &&
          updated.length >= effectiveMaxSelections
        ) {
          return;
        }

        updated.push(optionValue);
      } else {
        updated = updated.filter(
          (item) => item !== optionValue
        );
      }

      setSelected(updated);
      reportChange(updated);
    },
    [
      isReadOnly,
      selectedValues,
      effectiveMaxSelections,
      setSelected,
      reportChange,
    ]
  );

  // ===========================================================
  // 6. RADIO HANDLER
  // ===========================================================

  const handleRadioChange = useCallback(
    (optionValue) => {
      if (isReadOnly) return;

      setSelected([optionValue]);
      setOtherValue("");
      reportChange(optionValue);
    },
    [isReadOnly, setSelected, setOtherValue, reportChange]
  );

  // ===========================================================
  // 7. OTHER HANDLERS
  // ===========================================================

  const handleCheckboxOtherChange = useCallback(
    (isChecked) => {
      if (isReadOnly) return;

      let updated = [...selectedValues];

      if (isChecked) {
        if (
          effectiveMaxSelections > 0 &&
          updated.length >= effectiveMaxSelections
        ) {
          return;
        }

        updated.push("__other__");
      } else {
        updated = updated.filter(
          (item) => item !== "__other__"
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
      isReadOnly,
      selectedValues,
      effectiveMaxSelections,
      setSelected,
      otherValue,
      setOtherValue,
      reportChange,
    ]
  );

  const handleRadioOtherChange = useCallback(() => {
    if (isReadOnly) return;

    setSelected(["__other__"]);

    reportChange({
      value: "__other__",
      otherValue,
    });
  }, [isReadOnly, setSelected, otherValue, reportChange]);

  const handleOtherTextChange = useCallback(
    (newValue, isRadio = false) => {
      if (isReadOnly) return;

      setOtherValue(newValue);

      reportChange(
        isRadio
          ? {
              value: "__other__",
              otherValue: newValue,
            }
          : {
              value: selectedValues,
              otherValue: newValue,
            }
      );
    },
    [isReadOnly, selectedValues, setOtherValue, reportChange]
  );

  // ===========================================================
  // 8. MATRIX
  // ===========================================================

  const normalizeMatrixItems = useCallback(
    (list, fallback, prefix) => {
      const source =
        Array.isArray(list) && list.length
          ? list
          : fallback;

      return source.map((item, index) => {
        if (typeof item === "string") {
          return {
            label: item,
            value: item,
          };
        }

        return {
          label: item?.label ?? `${prefix} ${index + 1}`,
          value:
            item?.value ??
            item?.label ??
            `${prefix} ${index + 1}`,
        };
      });
    },
    []
  );

  const matrixQuestions = useMemo(
    () =>
      normalizeMatrixItems(
        normalizedElement.questions ?? normalizedElement.rows,
        [
          "How likely are you to watch movies?",
          "How likely are you to listen to music?",
        ],
        "Question"
      ),
    [normalizedElement.questions, normalizedElement.rows, normalizeMatrixItems]
  );

  const matrixAnswers = useMemo(
    () =>
      normalizeMatrixItems(
        normalizedElement.answers ?? normalizedElement.columns,
        ["Rarely", "Seldom", "Often", "Always"],
        "Answer"
      ),
    [normalizedElement.answers, normalizedElement.columns, normalizeMatrixItems]
  );

  const matrixAllowMultiple = Boolean(normalizedElement.allowMultiple);

  const getAnswerValue = useCallback(
    (question, answer) => `${question.value}::${answer.value}`,
    []
  );

  const isAnswerSelected = useCallback(
    (question, answer) =>
      selectedValues.includes(getAnswerValue(question, answer)),
    [selectedValues, getAnswerValue]
  );

  const handleMatrixSelection = useCallback(
    (question, answer) => {
      if (isReadOnly) return;

      const questionPrefix = `${question.value}::`;
      const answerValue = getAnswerValue(question, answer);

      const alreadySelected = selectedValues.includes(answerValue);

      let updatedValues;

      if (matrixAllowMultiple) {
        updatedValues = alreadySelected
          ? selectedValues.filter((item) => item !== answerValue)
          : [...selectedValues, answerValue];
      } else {
        updatedValues = [
          ...selectedValues.filter(
            (item) => !String(item).startsWith(questionPrefix)
          ),
          answerValue,
        ];
      }

      setSelected(updatedValues);
      reportChange(updatedValues);
    },
    [
      isReadOnly,
      getAnswerValue,
      selectedValues,
      matrixAllowMultiple,
      setSelected,
      reportChange,
    ]
  );

  // ===========================================================
  // 9. FEEDBACK
  // ===========================================================

  const feedbackEmojis =
    FEEDBACK_STYLES[normalizedElement.feedbackStyle] ||
    FEEDBACK_STYLES.experience;

  const feedbackAllowMultiple = Boolean(normalizedElement.allowMultiple);

  const feedbackMaxSelections = Number(
    normalizedElement.maxSelections
  );

  const handleFeedbackSelection = useCallback(
    (emoji) => {
      if (isReadOnly) return;

      const alreadySelected = selectedValues.includes(emoji);

      let updatedValues;

      if (feedbackAllowMultiple) {
        if (alreadySelected) {
          updatedValues = selectedValues.filter(
            (item) => item !== emoji
          );
        } else {
          if (
            feedbackMaxSelections > 0 &&
            selectedValues.length >= feedbackMaxSelections
          ) {
            return;
          }

          updatedValues = [...selectedValues, emoji];
        }
      } else {
        updatedValues = [emoji];
      }

      setSelected(updatedValues);
      reportChange(updatedValues);
    },
    [
      isReadOnly,
      selectedValues,
      feedbackAllowMultiple,
      feedbackMaxSelections,
      setSelected,
      reportChange,
    ]
  );

  // ===========================================================
  // 10. RETURN
  // ===========================================================

  return {
    options,
    selectedValues,

    minSelections,
    isMaxReached,
    hasMinimumSelections,

    optionsPerLine,
    checkboxColumns,
    choiceGridStyle,

    handleCheckboxChange,
    handleRadioChange,
    handleCheckboxOtherChange,
    handleRadioOtherChange,
    handleOtherTextChange,

    matrixQuestions,
    matrixAnswers,
    matrixAllowMultiple,
    getAnswerValue,
    isAnswerSelected,
    handleMatrixSelection,

    feedbackEmojis,
    feedbackAllowMultiple,
    handleFeedbackSelection,
  };
}
