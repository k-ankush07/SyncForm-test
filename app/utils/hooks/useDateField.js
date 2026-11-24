
import { useState, useEffect, useCallback } from "react";
import flatpickr from "flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";

// Locales
import { Spanish } from "flatpickr/dist/l10n/es.js";
import { French } from "flatpickr/dist/l10n/fr.js";
import { German } from "flatpickr/dist/l10n/de.js";
import { Italian } from "flatpickr/dist/l10n/it.js";
import { Portuguese } from "flatpickr/dist/l10n/pt.js";
import { Dutch } from "flatpickr/dist/l10n/nl.js";

export default function useDateField({
  savedValue,
  normalizedElement = {},
  reportChange,
}) {
  // ===========================================================
  // 1. DATE VALUE STATE
  // ===========================================================

  const getSavedDateValue = () => {
    if (savedValue !== undefined && savedValue !== null) {
      return String(savedValue);
    }

    return String(
      normalizedElement.defaultDate ??
      normalizedElement.defaultValue ??
      ""
    );
  };

  const [dateValue, setDateValue] = useState(getSavedDateValue);

  const [dateError, setDateError] = useState("");

  useEffect(() => {
    const nextDateValue = getSavedDateValue();

    setDateValue((previous) =>
      previous === nextDateValue ? previous : nextDateValue
    );

    setDateError("");
  }, [
    normalizedElement.id,
    normalizedElement.defaultDate,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // ===========================================================
  // 2. FIELD CONFIGURATION
  // ===========================================================

  const format = normalizedElement.format || "date_time";
  const dateFormat = normalizedElement.dateFormat || "Y-m-d";
  const timeFormat = normalizedElement.timeFormat || "24h";
  const timeType = normalizedElement.timeType || "picker";

  const timeStep = Math.max(
    1,
    Math.min(60, Number(normalizedElement.timeStep) || 15)
  );

  const onlyShowMonth = Boolean(
    normalizedElement.onlyShowMonth && format === "date"
  );

  const selectedLanguage = normalizedElement.otherLanguage
    ? String(normalizedElement.localization || "en").toLowerCase()
    : "en";

  const localeMap = {
    es: Spanish,
    spanish: Spanish,
    fr: French,
    french: French,
    de: German,
    german: German,
    it: Italian,
    italian: Italian,
    pt: Portuguese,
    portuguese: Portuguese,
    nl: Dutch,
    dutch: Dutch,
  };

  const selectedLocale = localeMap[selectedLanguage] || undefined;

  // ===========================================================
  // 3. DATE HELPERS
  // ===========================================================

  const getDateOnly = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const parseDateValue = (value, customFormat) => {
    if (!value) return null;

    const text = String(value).trim();

    // Parse YYYY-MM-DD as a local date.
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      const parsed = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      );

      // Reject impossible dates such as 2026-02-31.
      if (
        parsed.getFullYear() !== Number(match[1]) ||
        parsed.getMonth() !== Number(match[2]) - 1 ||
        parsed.getDate() !== Number(match[3])
      ) {
        return null;
      }

      return parsed;
    }

    if (customFormat) {
      try {
        const parsed = flatpickr.parseDate(text, customFormat);

        if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch {
        // Fall through to native parsing.
      }
    }

    const parsed = new Date(text);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const addDays = (date, days) => {
    const result = new Date(date);

    result.setDate(result.getDate() + Number(days || 0));

    return result;
  };

  const normalizeDate = (date) => {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
  };

  // ===========================================================
  // 4. TIME HELPERS
  // ===========================================================

  const getTimeMinutes = (timeValue) => {
    if (!timeValue) return null;

    const text = String(timeValue).trim();

    // 12-hour format: 01:30 PM
    const twelveHour = text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (twelveHour) {
      const inputHour = Number(twelveHour[1]);
      const minutes = Number(twelveHour[2]);

      if (
        inputHour < 1 ||
        inputHour > 12 ||
        minutes < 0 ||
        minutes > 59
      ) {
        return null;
      }

      let hours = inputHour % 12;

      if (twelveHour[3].toUpperCase() === "PM") {
        hours += 12;
      }

      return hours * 60 + minutes;
    }

    // 24-hour format: 13:30
    const twentyFourHour = text.match(/^(\d{1,2}):(\d{2})$/);

    if (twentyFourHour) {
      const hours = Number(twentyFourHour[1]);
      const minutes = Number(twentyFourHour[2]);

      if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        return null;
      }

      return hours * 60 + minutes;
    }

    return null;
  };

  const formatTimeOption = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (timeFormat === "12h") {
      const period = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;

      return `${String(displayHour).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")} ${period}`;
    }

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;
  };

  const getTimeOptions = () => {
    const start =
      normalizedElement.enableStartTime === true
        ? getTimeMinutes(normalizedElement.startTime)
        : 0;

    const end =
      normalizedElement.enableEndTime === true
        ? getTimeMinutes(normalizedElement.endTime)
        : 23 * 60 + 59;

    if (start === null || end === null || start > end) {
      return [];
    }

    const options = [];

    for (let minutes = start; minutes <= end; minutes += timeStep) {
      const formattedTime = formatTimeOption(minutes);

      options.push({
        label: formattedTime,
        value: formattedTime,
      });
    }

    return options;
  };

  const timeOptions = getTimeOptions();

  // ===========================================================
  // 5. DATE BOUNDARIES
  // ===========================================================

  const today = normalizeDate(new Date());

  let minDate;
  let maxDate;

  if (normalizedElement.startDateType === "today") {
    minDate = today;
  } else if (normalizedElement.startDateType === "specificDate") {
    minDate =
      parseDateValue(normalizedElement.specificStartDate) || undefined;
  } else if (normalizedElement.startDateType === "relativeDate") {
    minDate = addDays(
      today,
      Number(normalizedElement.relativeStartDate) || 0
    );
  }

  if (normalizedElement.endDateType === "today") {
    maxDate = today;
  } else if (normalizedElement.endDateType === "specificDate") {
    maxDate =
      parseDateValue(normalizedElement.specificDate) || undefined;
  } else if (normalizedElement.endDateType === "relativeDate") {
    maxDate = addDays(
      today,
      Number(normalizedElement.relativeEndDate) || 0
    );
  }

  // ===========================================================
  // 6. DATE RESTRICTIONS
  // ===========================================================

  const limitEnabled = Boolean(
    normalizedElement.limitDatePicker && format === "date"
  );

  const limitType = normalizedElement.limitDateType || "disable";

  const specificDates = String(
    normalizedElement.specificDates || ""
  )
    .split(",")
    .map((item) => parseDateValue(item.trim()))
    .filter(Boolean)
    .map(getDateOnly);

  const rangeParts = String(
    normalizedElement.rangeDates || ""
  )
    .split(/\s+to\s+/i)
    .map((item) => parseDateValue(item.trim()))
    .filter(Boolean);

  const rangeStart = rangeParts[0]
    ? getDateOnly(rangeParts[0])
    : null;

  const rangeEnd = rangeParts[1]
    ? getDateOnly(rangeParts[1])
    : rangeStart;

  const selectedDays = Array.isArray(
    normalizedElement.targetDaysOfWeek
  )
    ? normalizedElement.targetDaysOfWeek.map((day) =>
        String(day).toLowerCase()
      )
    : [];

  const weekdayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const hasSpecificDates = Boolean(
    limitEnabled && normalizedElement.enableSpecificDates
  );

  const hasRangeDates = Boolean(
    limitEnabled && normalizedElement.enableRangeDates
  );

  const hasWeekdays = Boolean(
    limitEnabled && normalizedElement.enableDaysOfWeek
  );

  const hasAnyRestriction =
    hasSpecificDates || hasRangeDates || hasWeekdays;

  const isDateInRange = (dateString) => {
    if (!rangeStart) return false;

    return (
      dateString >= rangeStart &&
      dateString <= (rangeEnd || rangeStart)
    );
  };

  const matchesConfiguredDates = (date) => {
    const dateString = getDateOnly(date);
    const weekday = weekdayNames[date.getDay()];

    const matchesSpecific =
      hasSpecificDates && specificDates.includes(dateString);

    const matchesRange =
      hasRangeDates && isDateInRange(dateString);

    const matchesWeekday =
      hasWeekdays && selectedDays.includes(weekday);

    return matchesSpecific || matchesRange || matchesWeekday;
  };

  // ===========================================================
  // 7. ENABLE / DISABLE DATE CALLBACKS
  // ===========================================================

  let enableDates;
  let disableDates;

  if (limitEnabled && hasAnyRestriction) {
    if (limitType === "enable") {
      enableDates = [(date) => matchesConfiguredDates(date)];
    } else {
      disableDates = [(date) => matchesConfiguredDates(date)];
    }
  }

  // ===========================================================
  // 8. DATE AND TIME VALUE FORMATTING
  // ===========================================================

  const currentValue =
    typeof dateValue === "string" ? dateValue.trim() : dateValue;

  const isTimeOnlyValue =
    typeof currentValue === "string" &&
    /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(currentValue);

  const isDateOnlyValue =
    typeof currentValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(currentValue);

  const dateOnlyValue = isTimeOnlyValue
    ? ""
    : currentValue || "";

  const timeOnlyValue = isDateOnlyValue
    ? ""
    : currentValue || "";

  const combinedDateFormat =
    timeFormat === "12h"
      ? `${dateFormat} h:i K`
      : `${dateFormat} H:i`;

  // ===========================================================
  // 9. FLATPICKR OPTIONS
  // ===========================================================

  const commonPickerOptions = {
    clickOpens: true,
    disableMobile: true,
    allowInput: false,
    static: false,
    animate: true,
    ...(selectedLocale ? { locale: selectedLocale } : {}),
  };

  const datePickerOptions = {
    ...commonPickerOptions,

    enableTime: false,
    noCalendar: false,

    dateFormat: onlyShowMonth ? "Y-m" : dateFormat,

    minDate,
    maxDate,

    ...(enableDates ? { enable: enableDates } : {}),
    ...(disableDates ? { disable: disableDates } : {}),

    monthSelectorType: "dropdown",

    ...(onlyShowMonth
      ? {
          plugins: [
            new monthSelectPlugin({
              shorthand: false,
              dateFormat: "Y-m",
              altFormat: "F Y",
              theme: "light",
            }),
          ],
        }
      : {}),
  };

  const dateTimePickerOptions = {
    ...commonPickerOptions,

    enableTime: true,
    noCalendar: false,

    dateFormat: combinedDateFormat,

    time_24hr: timeFormat !== "12h",
    minuteIncrement: timeStep,

    minDate,
    maxDate,

    monthSelectorType: "dropdown",
  };

  const timePickerOptions = {
    ...commonPickerOptions,

    enableTime: true,
    noCalendar: true,

    dateFormat: timeFormat === "12h" ? "h:i K" : "H:i",

    time_24hr: timeFormat !== "12h",
    minuteIncrement: timeStep,

    defaultHour: 12,
    defaultMinute: 0,
  };

  // ===========================================================
  // 10. DATE VALIDATION
  // ===========================================================

  const getDateValidationError = (inputValue) => {
    const text = String(inputValue ?? "").trim();

    if (!text) {
      return normalizedElement.required
        ? `${normalizedElement.label || normalizedElement.name || "This field"} is required.`
        : "";
    }

    // Time-only validation
    if (format === "time") {
      const selectedMinutes = getTimeMinutes(text);

      if (selectedMinutes === null) {
        return "Please select a valid time.";
      }

      const start =
        normalizedElement.enableStartTime === true
          ? getTimeMinutes(normalizedElement.startTime)
          : 0;

      const end =
        normalizedElement.enableEndTime === true
          ? getTimeMinutes(normalizedElement.endTime)
          : 23 * 60 + 59;

      if (
        start !== null &&
        end !== null &&
        (selectedMinutes < start || selectedMinutes > end)
      ) {
        return "Selected time is outside the allowed time range.";
      }

      return "";
    }

    // Date or date-time validation
    const selectedDate = parseDateValue(
      text,
      format === "date_time"
        ? combinedDateFormat
        : onlyShowMonth
          ? "Y-m"
          : dateFormat
    );

    if (!selectedDate) {
      return "Please select a valid date.";
    }

    const selectedDay = normalizeDate(selectedDate);

    if (minDate && selectedDay < normalizeDate(minDate)) {
      return "Selected date is earlier than the allowed start date.";
    }

    if (maxDate && selectedDay > normalizeDate(maxDate)) {
      return "Selected date is later than the allowed end date.";
    }

    // Specific dates, ranges and weekdays
    if (limitEnabled && hasAnyRestriction) {
      const matches = matchesConfiguredDates(selectedDate);

      if (limitType === "enable" && !matches) {
        return "This date is not available for selection.";
      }

      if (limitType !== "enable" && matches) {
        return "This date is not available for selection.";
      }
    }

    return "";
  };

  const validateDate = useCallback(
    (inputValue = dateValue) => {
      const validationError = getDateValidationError(inputValue);

      setDateError(validationError);

      return validationError;
    },
    [
      dateValue,
      normalizedElement.required,
      normalizedElement.label,
      normalizedElement.name,
      format,
      combinedDateFormat,
      dateFormat,
      onlyShowMonth,
      minDate?.getTime(),
      maxDate?.getTime(),
      limitEnabled,
      hasAnyRestriction,
      limitType,
      specificDates.join(","),
      rangeStart,
      rangeEnd,
      selectedDays.join(","),
    ]
  );

  // ===========================================================
  // 11. UPDATE DATE VALUE
  // ===========================================================

  const updateDateValue = useCallback(
    (nextValue) => {
      const safeValue = nextValue ?? "";

      setDateValue(safeValue);
      reportChange?.(safeValue);

      // Revalidate only after validation has already been triggered.
      setDateError((previousError) =>
        previousError
          ? getDateValidationError(safeValue)
          : previousError
      );
    },
    [
      reportChange,
      normalizedElement.required,
      normalizedElement.label,
      normalizedElement.name,
      format,
      combinedDateFormat,
      dateFormat,
      onlyShowMonth,
      minDate?.getTime(),
      maxDate?.getTime(),
      limitEnabled,
      hasAnyRestriction,
      limitType,
      specificDates.join(","),
      rangeStart,
      rangeEnd,
      selectedDays.join(","),
    ]
  );

  return {
    dateValue,
    setDateValue,
    updateDateValue,

    dateError,
    validateDate,

    dateOnlyValue,
    timeOnlyValue,

    datePickerOptions,
    dateTimePickerOptions,
    timePickerOptions,
    timeOptions,

    format,
    timeType,
    onlyShowMonth,
  };
}
