
import React, { useState, useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import {
    BlockStack,
    TextField,
    Checkbox,
    Text,
    Divider,
    Select,
} from "@shopify/polaris";

// =====================================
// REUSABLE FLATPICKR INPUT
// =====================================

const FlatpickrInput = ({
    value,
    onChange,
    dateFormat = "Y-m-d",
    mode = "single",
    enableTime = false,
    noCalendar = false,
    time24hr = true,
    minuteIncrement = 5,
    placeholder = "",
    className = "date-time-flatpickr-input",
}) => {
    const inputRef = useRef(null);
    const instanceRef = useRef(null);
    const onChangeRef = useRef(onChange);

    onChangeRef.current = onChange;

    // =====================================
    // INITIALIZE FLATPICKR
    // =====================================

    useEffect(() => {
        const input = inputRef.current;

        if (!input) return;

        // Clean up an existing instance, if present.
        const existingInstance = input._flatpickr;

        if (
            existingInstance &&
            typeof existingInstance.destroy === "function"
        ) {
            existingInstance.destroy();
        }

        // Initialize Flatpickr.
        const createdInstance = flatpickr(input, {
            enableTime,
            noCalendar,
            dateFormat,
            mode,
            allowInput: false,
            monthSelectorType: "dropdown",
            animate: true,
            time_24hr: time24hr,
            minuteIncrement: Math.max(
                1,
                Number(minuteIncrement) || 5
            ),

            onChange: (selectedDates, dateString) => {
                onChangeRef.current?.(
                    dateString,
                    selectedDates
                );
            },
        });

        // Get the actual instance attached to the input.
        const instance = input._flatpickr || createdInstance;

        if (
            !instance ||
            typeof instance.destroy !== "function"
        ) {
            console.error(
                "Flatpickr initialization failed.",
                instance
            );

            return;
        }

        instanceRef.current = instance;

        // =====================================
        // CLEANUP
        // =====================================

        return () => {
            const currentInstance = input._flatpickr;

            if (
                currentInstance &&
                currentInstance === instance &&
                typeof currentInstance.destroy === "function"
            ) {
                currentInstance.destroy();
            }

            instanceRef.current = null;
        };
    }, [
        dateFormat,
        mode,
        enableTime,
        noCalendar,
        time24hr,
        minuteIncrement,
    ]);

    // =====================================
    // SYNC VALUE WITH FLATPICKR
    // =====================================

    useEffect(() => {
        const instance = instanceRef.current;

        if (
            !instance ||
            typeof instance.setDate !== "function"
        ) {
            return;
        }

        if (
            value === undefined ||
            value === null ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
        ) {
            if (typeof instance.clear === "function") {
                instance.clear(false);
            }

            return;
        }

        instance.setDate(value, false, dateFormat);
    }, [value, dateFormat]);

    return (
        <input
            ref={inputRef}
            type="text"
            readOnly
            placeholder={placeholder}
            className={className}
        />
    );
};

// =====================================
// TARGET DAYS PICKER
// =====================================

const TargetDaysPicker = ({ value = [], onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedDays = Array.isArray(value) ? value : [];

    const days = [
        { label: "Monday", value: "monday" },
        { label: "Tuesday", value: "tuesday" },
        { label: "Wednesday", value: "wednesday" },
        { label: "Thursday", value: "thursday" },
        { label: "Friday", value: "friday" },
        { label: "Saturday", value: "saturday" },
        { label: "Sunday", value: "sunday" },
    ];

    const toggleDay = (day) => {
        const updatedDays = selectedDays.includes(day)
            ? selectedDays.filter((item) => item !== day)
            : [...selectedDays, day];

        onChange(updatedDays);
    };

    const removeDay = (day) => {
        onChange(
            selectedDays.filter((item) => item !== day)
        );
    };

    return (
        <div className="target-days-picker">
            <div
                className="target-days-selection"
                onClick={() => setIsOpen((previous) => !previous)}
            >
                <div className="target-days-values">
                    {selectedDays.map((day) => (
                        <span
                            key={day}
                            className="target-day-chip"
                            onClick={(event) => event.stopPropagation()}
                        >
                            {day}

                            <button
                                type="button"
                                onClick={() => removeDay(day)}
                                aria-label={`Remove ${day}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}

                    {selectedDays.length === 0 && (
                        <span className="target-days-placeholder">
                            Select days
                        </span>
                    )}
                </div>

                <span
                    className={`target-days-arrow ${
                        isOpen ? "open" : ""
                    }`}
                >
                    <svg viewBox="0 0 10 7" width="10" height="7">
                        <path
                            d="M1 1l4 4 4-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className="target-days-options">
                    {days.map((day) => {
                        const selected = selectedDays.includes(
                            day.value
                        );

                        return (
                            <div
                                key={day.value}
                                className={`target-days-option ${
                                    selected ? "selected" : ""
                                }`}
                                onClick={() => toggleDay(day.value)}
                            >
                                <span>{day.label}</span>

                                {selected && <span>✓</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// =====================================
// REUSABLE DATE PICKER
// =====================================

const DatePickerField = ({
    label,
    value,
    onChange,
    dateFormat = "Y-m-d",
    mode = "single",
}) => {
    return (
        <BlockStack gap="200">
            {label && (
                <Text as="span" variant="bodyMd">
                    {label}
                </Text>
            )}

            <FlatpickrInput
                value={value || ""}
                onChange={onChange}
                dateFormat={dateFormat}
                mode={mode}
                placeholder={dateFormat}
            />
        </BlockStack>
    );
};

// =====================================
// DATE SETTINGS
// =====================================

const DateSettings = ({ element, onChange }) => {
    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    // =====================================
    // SELECTED FORMAT
    // =====================================

    const format = element.format || "date_time";

    // Date & time and Date share date settings.
    const showDateSettings =
        format === "date_time" || format === "date";

    // Date & time and Time share time format settings.
    const showTimeFormat =
        format === "date_time" || format === "time";

    // Only Date displays date restrictions.
    const showDateRestrictions = format === "date";

    // Only Time displays advanced time settings.
    const showAdvancedTimeSettings = format === "time";

    const dateFormat = element.dateFormat || "Y-m-d";
    const timeFormat = element.timeFormat || "24h";

    // =====================================
    // LOCALIZATION OPTIONS
    // =====================================

    const localizationOptions = [
        { label: "Arabic", value: "ar" },
        { label: "Austria", value: "at" },
        { label: "Azerbaijan", value: "az" },
        { label: "Belarusian", value: "be" },
        { label: "Bosnian", value: "bs" },
        { label: "Bulgarian", value: "bg" },
        { label: "Bangla", value: "bn" },
        { label: "Catalan", value: "cat" },
        { label: "Czech", value: "cs" },
        { label: "Welsh", value: "cy" },
        { label: "Danish", value: "da" },
        { label: "German", value: "de" },
        { label: "Esperanto", value: "eo" },
        { label: "Spanish", value: "es" },
        { label: "Estonian", value: "et" },
        { label: "Persian", value: "fa" },
        { label: "Finnish", value: "fi" },
        { label: "Faroese", value: "fo" },
        { label: "French", value: "fr" },
        { label: "Greek", value: "gr" },
        { label: "Hebrew", value: "he" },
        { label: "Hindi", value: "hi" },
        { label: "Croatian", value: "hr" },
        { label: "Hungarian", value: "hu" },
        { label: "Indonesian", value: "id" },
        { label: "Icelandic", value: "is" },
        { label: "Italian", value: "it" },
        { label: "Japanese", value: "ja" },
        { label: "Georgian", value: "ka" },
        { label: "Korean", value: "ko" },
        { label: "Khmer", value: "km" },
        { label: "Kazakh", value: "kz" },
        { label: "Lithuanian", value: "lt" },
        { label: "Latvian", value: "lv" },
        { label: "Macedonian", value: "mk" },
        { label: "Mongolian", value: "mn" },
        { label: "Malaysian", value: "ms" },
        { label: "Burmese", value: "my" },
        { label: "Dutch", value: "nl" },
        { label: "Norwegian", value: "no" },
        { label: "Punjabi", value: "pa" },
        { label: "Polish", value: "pl" },
        { label: "Portuguese", value: "pt" },
        { label: "Romanian", value: "ro" },
        { label: "Russian", value: "ru" },
        { label: "Sinhala", value: "si" },
        { label: "Slovak", value: "sk" },
        { label: "Slovenian", value: "sl" },
        { label: "Albanian", value: "sq" },
        { label: "Serbian", value: "sr" },
        { label: "Swedish", value: "sv" },
        { label: "Thai", value: "th" },
        { label: "Turkish", value: "tr" },
        { label: "Ukrainian", value: "uk" },
        { label: "Uzbek", value: "uz" },
        { label: "Vietnamese", value: "vn" },
        { label: "Mandarin", value: "zh" },
    ];

    // =====================================
    // DATE FORMAT OPTIONS
    // =====================================

    const dateFormatOptions = [
        { label: "Y-m-d", value: "Y-m-d" },
        { label: "d-m-Y", value: "d-m-Y" },
        { label: "d-M-y", value: "d-M-y" },
        { label: "m-d-Y", value: "m-d-Y" },
        { label: "d-m", value: "d-m" },
        { label: "m-d", value: "m-d" },
        { label: "Y/m/d", value: "Y/m/d" },
        { label: "d/m/Y", value: "d/m/Y" },
        { label: "m/d/Y", value: "m/d/Y" },
        { label: "d/m", value: "d/m" },
        { label: "m/d", value: "m/d" },
    ];

    // =====================================
    // TIME FORMAT OPTIONS
    // =====================================

    const timeFormatOptions = [
        { label: "24h", value: "24h" },
        { label: "12h", value: "12h" },
    ];

    // =====================================
    // START / END DATE OPTIONS
    // =====================================

    const startDateOptions = [
        { label: "Unset", value: "false" },
        { label: "Today", value: "today" },
        { label: "Specific date", value: "specificDate" },
        { label: "Relative date", value: "relativeDate" },
    ];

    const endDateOptions = [
        { label: "Unset", value: "false" },
        { label: "Today", value: "today" },
        { label: "Specific end date", value: "specificDate" },
        { label: "Relative date", value: "relativeDate" },
    ];

    // =====================================
    // TIME TYPE OPTIONS
    // =====================================

    const timeTypeOptions = [
        { label: "Time picker", value: "picker" },
        { label: "Dropdown", value: "dropdown" },
    ];

    // =====================================
    // START / END TIME PICKER
    // =====================================

    const renderTimePicker = (field, defaultValue, label) => {
        const enabledKey =
            field === "startTime"
                ? "enableStartTime"
                : "enableEndTime";

        const enabled = element[enabledKey] !== false;

        const pickerFormat =
            timeFormat === "12h" ? "h:i K" : "H:i";

        const fallbackValue =
            timeFormat === "12h"
                ? field === "startTime"
                    ? "12:00 PM"
                    : "12:00 AM"
                : defaultValue;

        return (
            <BlockStack gap="200">
                <Checkbox
                    label={label}
                    checked={enabled}
                    onChange={(checked) =>
                        update(enabledKey, checked)
                    }
                />

                {enabled && (
                    <FlatpickrInput
                        value={element[field] || fallbackValue}
                        onChange={(dateString) =>
                            update(field, dateString)
                        }
                        dateFormat={pickerFormat}
                        mode="single"
                        enableTime
                        noCalendar
                        time24hr={timeFormat !== "12h"}
                        minuteIncrement={element.timeStep ?? 8}
                        placeholder={label}
                        className="Polaris-TextField__Input date-time-flatpickr-input"
                    />
                )}
            </BlockStack>
        );
    };

    // =====================================
    // UI
    // =====================================

    return (
        <BlockStack gap="400">

            {/* =====================================
                FORMAT
            ====================================== */}

            <BlockStack gap="200">
                <Text as="span" variant="bodyMd">
                    Format
                </Text>

                <div className="column-width-selector">
                    {[
                        { label: "Date & time", value: "date_time" },
                        { label: "Date", value: "date" },
                        { label: "Time", value: "time" },
                    ].map((item) => (
                        <div
                            key={item.value}
                            className={`chooseItem ${
                                format === item.value ? "active" : ""
                            }`}
                            onClick={() => update("format", item.value)}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            </BlockStack>

            {/* =====================================
                OTHER LANGUAGE
                AVAILABLE FOR ALL FORMATS
            ====================================== */}

            <Checkbox
                label="Other language"
                checked={Boolean(element.otherLanguage)}
                onChange={(checked) =>
                    update("otherLanguage", checked)
                }
            />

            {element.otherLanguage && (
                <Select
                    label="Localization"
                    options={localizationOptions}
                    value={element.localization || "es"}
                    onChange={(value) =>
                        update("localization", value)
                    }
                />
            )}

            {/* =====================================
                DATE FORMAT
                DATE & TIME + DATE
            ====================================== */}

            {showDateSettings && (
                <>
                    <Divider />

                    <Select
                        label="Date format"
                        options={dateFormatOptions}
                        value={dateFormat}
                        onChange={(value) =>
                            update("dateFormat", value)
                        }
                    />

                    {/* DEFAULT DATE */}

                    <DatePickerField
                        label="Default date"
                        value={element.defaultDate || ""}
                        onChange={(value) =>
                            update("defaultDate", value)
                        }
                        dateFormat={dateFormat}
                    />

                    {/* START DATE */}

                    <Select
                        label="Start date"
                        options={startDateOptions}
                        value={element.startDateType || "false"}
                        onChange={(value) =>
                            update("startDateType", value)
                        }
                    />

                    {element.startDateType === "specificDate" && (
                        <DatePickerField
                            label="Specific date"
                            value={element.specificStartDate || ""}
                            onChange={(value) =>
                                update("specificStartDate", value)
                            }
                            dateFormat={dateFormat}
                        />
                    )}

                    {element.startDateType === "relativeDate" && (
                        <TextField
                            label="Relative date (days)"
                            type="number"
                            value={String(
                                element.relativeStartDate ?? ""
                            )}
                            onChange={(value) =>
                                update("relativeStartDate", value)
                            }
                            autoComplete="off"
                        />
                    )}

                    {/* END DATE */}

                    <Select
                        label="End date"
                        options={endDateOptions}
                        value={element.endDateType || "false"}
                        onChange={(value) =>
                            update("endDateType", value)
                        }
                    />

                    {element.endDateType === "specificDate" && (
                        <DatePickerField
                            label="Specific end date"
                            value={element.specificDate || ""}
                            onChange={(value) =>
                                update("specificDate", value)
                            }
                            dateFormat={dateFormat}
                        />
                    )}

                    {element.endDateType === "relativeDate" && (
                        <TextField
                            label="Relative date (days)"
                            type="number"
                            value={String(
                                element.relativeEndDate ?? ""
                            )}
                            onChange={(value) =>
                                update("relativeEndDate", value)
                            }
                            autoComplete="off"
                        />
                    )}
                </>
            )}

            {/* =====================================
                DATE-ONLY RESTRICTIONS
                ONLY WHEN DATE IS SELECTED
            ====================================== */}

            {showDateRestrictions && (
                <>
                    <Divider />

                    <Checkbox
                        label="Limit date picker"
                        checked={Boolean(element.limitDatePicker)}
                        onChange={(checked) =>
                            update("limitDatePicker", checked)
                        }
                    />

                    {element.limitDatePicker && (
                        <BlockStack gap="300">

                            {/* LIMIT DATE TYPE */}

                            <Select
                                label="Limit date type"
                                options={[
                                    {
                                        label: "Disabling dates",
                                        value: "disable",
                                    },
                                    {
                                        label: "Enabling dates",
                                        value: "enable",
                                    },
                                ]}
                                value={element.limitDateType || "disable"}
                                onChange={(value) =>
                                    update("limitDateType", value)
                                }
                            />

                            {/* SPECIFIC DATES */}

                            <Checkbox
                                label="Specific dates"
                                checked={Boolean(
                                    element.enableSpecificDates
                                )}
                                onChange={(checked) =>
                                    update("enableSpecificDates", checked)
                                }
                            />

                            {element.enableSpecificDates && (
                                <DatePickerField
                                    label="Select specific dates"
                                    value={element.specificDates || ""}
                                    onChange={(value) =>
                                        update("specificDates", value)
                                    }
                                    dateFormat={dateFormat}
                                    mode="multiple"
                                />
                            )}

                            {/* RANGE DATES */}

                            <Checkbox
                                label="Range dates"
                                checked={Boolean(
                                    element.enableRangeDates
                                )}
                                onChange={(checked) =>
                                    update("enableRangeDates", checked)
                                }
                            />

                            {element.enableRangeDates && (
                                <DatePickerField
                                    label="Select range dates"
                                    value={element.rangeDates || ""}
                                    onChange={(value) =>
                                        update("rangeDates", value)
                                    }
                                    dateFormat={dateFormat}
                                    mode="range"
                                />
                            )}

                            {/* DAYS OF WEEK */}

                            <Checkbox
                                label="Days of week"
                                checked={Boolean(
                                    element.enableDaysOfWeek
                                )}
                                onChange={(checked) =>
                                    update("enableDaysOfWeek", checked)
                                }
                            />

                            {element.enableDaysOfWeek && (
                                <BlockStack gap="200">
                                    <Text as="span" variant="bodyMd">
                                        Target days of week
                                    </Text>

                                    <TargetDaysPicker
                                        value={
                                            element.targetDaysOfWeek || []
                                        }
                                        onChange={(value) =>
                                            update(
                                                "targetDaysOfWeek",
                                                value
                                            )
                                        }
                                    />
                                </BlockStack>
                            )}
                        </BlockStack>
                    )}

                    {/* ONLY SHOW MONTH */}

                    <Checkbox
                        label="Only show month"
                        checked={Boolean(element.onlyShowMonth)}
                        onChange={(checked) =>
                            update("onlyShowMonth", checked)
                        }
                    />
                </>
            )}

            {/* =====================================
                TIME FORMAT
                DATE & TIME + TIME
            ====================================== */}

            {showTimeFormat && (
                <>
                    <Divider />

                    <Select
                        label="Time format"
                        options={timeFormatOptions}
                        value={timeFormat}
                        onChange={(value) =>
                            update("timeFormat", value)
                        }
                    />
                </>
            )}

            {/* =====================================
                ADVANCED TIME SETTINGS
                ONLY WHEN TIME IS SELECTED
            ====================================== */}

            {showAdvancedTimeSettings && (
                <>
                    <Divider />

                    {/* TYPE */}

                    <BlockStack gap="200">
                        <Text as="span" variant="bodyMd">
                            Type
                        </Text>

                        <div className="column-width-selector">
                            {timeTypeOptions.map((item) => (
                                <div
                                    key={item.value}
                                    className={`chooseItem ${
                                        (element.timeType || "picker") ===
                                        item.value
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        update("timeType", item.value)
                                    }
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </BlockStack>

                    {/* STEP */}

                    <TextField
                        label="Step"
                        type="number"
                        value={String(element.timeStep ?? "8")}
                        onChange={(value) =>
                            update("timeStep", value)
                        }
                        autoComplete="off"
                        suffix="minutes"
                    />

                    {/* START TIME */}

                    {renderTimePicker(
                        "startTime",
                        "12:00",
                        "Start time"
                    )}

                    {/* END TIME */}

                    {renderTimePicker(
                        "endTime",
                        "00:00",
                        "End time"
                    )}
                </>
            )}
        </BlockStack>
    );
};

export default DateSettings;
