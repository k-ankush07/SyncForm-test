
import React, { useState } from "react";
import Flatpickr from "react-flatpickr";
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
// TARGET DAYS PICKER
// =====================================
const TargetDaysPicker = ({ value = [], onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

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
        const updatedDays = value.includes(day)
            ? value.filter((item) => item !== day)
            : [...value, day];

        onChange(updatedDays);
    };

    const removeDay = (day) => {
        onChange(value.filter((item) => item !== day));
    };

    return (
        <div className="target-days-picker">
            <div
                className="target-days-selection"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="target-days-values">
                    {value.map((day) => (
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

                    {value.length === 0 && (
                        <span className="target-days-placeholder">
                            Select days
                        </span>
                    )}
                </div>

                <span className={`target-days-arrow ${isOpen ? "open" : ""}`}>
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
                        const selected = value.includes(day.value);

                        return (
                            <div
                                key={day.value}
                                className={`target-days-option ${selected ? "selected" : ""
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

            <Flatpickr
                value={value || ""}
                options={{
                    enableTime: false,
                    noCalendar: false,
                    dateFormat,
                    mode,
                    allowInput: false,
                    monthSelectorType: "dropdown",
                    animate: true,
                }}
                onChange={(dates, dateString) => {
                    onChange(dateString);
                }}
                render={(props, ref) => (
                    <input
                        {...props}
                        ref={ref}
                        value={value || ""}
                        readOnly
                        placeholder={dateFormat}
                        className="date-time-flatpickr-input"
                    />
                )}
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

    // Selected format
    const format = element.format || "date_time";

    const showDateSettings =
        format === "date_time" || format === "date";

    const showTimeSettings =
        format === "date_time" || format === "time";

    const isDate = format === "date";

    const dateFormat = element.dateFormat || "Y-m-d";

    // =====================================
    // OPTIONS
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

    const timeFormatOptions = [
        { label: "24h", value: "24h" },
        { label: "12h", value: "12h" },
    ];

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

    const targetDayOptions = [
        { label: "All days", value: "all" },
        { label: "Weekdays", value: "weekdays" },
        { label: "Weekends", value: "weekends" },
        { label: "Saturday", value: "saturday" },
        { label: "Sunday", value: "sunday" },
    ];

    const timeTypeOptions = [
        { label: "Time picker", value: "picker" },
        { label: "Dropdown", value: "dropdown" },
    ];

    // =====================================
    // TIME PICKER
    // =====================================

    const renderTimePicker = (field, defaultValue, label) => {
        const enabledKey =
            field === "startTime"
                ? "enableStartTime"
                : "enableEndTime";

        const enabled = element[enabledKey] !== false;

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
                    <Flatpickr
                        value={element[field] || defaultValue}
                        options={{
                            enableTime: true,
                            noCalendar: true,
                            dateFormat: "H:i",
                            time_24hr: element.timeFormat !== "12h",
                            minuteIncrement: Math.max(
                                1,
                                Number(element.timeStep) || 5
                            ),
                        }}
                        onChange={(dates, dateString) =>
                            update(field, dateString)
                        }
                        render={(props, ref) => (
                            <input
                                {...props}
                                ref={ref}
                                value={element[field] || defaultValue}
                                readOnly
                                placeholder={label}
                                className="Polaris-TextField__Input date-time-flatpickr-input"
                            />
                        )}
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

            {/* FORMAT */}

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
                            className={`chooseItem ${format === item.value ? "active" : ""
                                }`}
                            onClick={() => update("format", item.value)}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            </BlockStack>

            {/* OTHER LANGUAGE */}

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
                DATE SETTINGS
            ====================================== */}

            {showDateSettings && (
                <>
                    <Divider />

                    <BlockStack gap="300">

                        {/* DATE FORMAT */}

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
                            value={element.defaultDate}
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
                                value={element.specificStartDate}
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
                                value={element.specificDate}
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

                        {/* SPECIFIC DATE */}

                        <DatePickerField
                            label="Specific date"
                            value={element.selectedSpecificDate}
                            onChange={(value) =>
                                update("selectedSpecificDate", value)
                            }
                            dateFormat={dateFormat}
                        />

                    </BlockStack>
                </>
            )}

            {/* =====================================
                LIMIT DATE PICKER
                ONLY WHEN DATE IS SELECTED
            ====================================== */}

            {isDate && (
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
                                    value={element.specificDates}
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
                                    value={element.rangeDates}
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
                                        value={element.targetDaysOfWeek || []}
                                        onChange={(value) =>
                                            update("targetDaysOfWeek", value)
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
                TIME SETTINGS
            ====================================== */}

            {showTimeSettings && (
                <>
                    <Divider />

                    <BlockStack gap="300">

                        {/* TIME FORMAT */}

                        <Select
                            label="Time format"
                            options={timeFormatOptions}
                            value={element.timeFormat || "24h"}
                            onChange={(value) =>
                                update("timeFormat", value)
                            }
                        />

                        {/* TYPE */}

                        <BlockStack gap="200">
                            <Text as="span" variant="bodyMd">
                                Type
                            </Text>

                            <div className="column-width-selector">
                                {timeTypeOptions.map((item) => (
                                    <div
                                        key={item.value}
                                        className={`chooseItem ${(element.timeType || "picker") ===
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
                            value={String(element.timeStep ?? "15")}
                            onChange={(value) =>
                                update("timeStep", value)
                            }
                            suffix="minutes"
                            autoComplete="off"
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

                    </BlockStack>
                </>
            )}

        </BlockStack>
    );
};

export default DateSettings;
