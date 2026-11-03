
import React from "react";

import {
    BlockStack,
    TextField,
    Checkbox,
    Text,
    Divider,
    Select,
} from "@shopify/polaris";

const DateSettings = ({ element, onChange }) => {
    // Update element settings
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


    const isDate = String(format).toLowerCase().trim() === "date";
    // Localization options
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

    // Date format options
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

    // Time format options
    const timeFormatOptions = [
        { label: "24h", value: "24h" },
        { label: "12h", value: "12h" },
    ];

    // Start date options
    const startDateOptions = [
        { label: "Unset", value: "false" },
        { label: "Today", value: "today" },
        { label: "Specific date", value: "specificDate" },
        { label: "Relative date", value: "relativeDate" },
    ];

    // End date options
    const endDateOptions = [
        { label: "Unset", value: "false" },
        { label: "Today", value: "today" },
        { label: "Specific end date", value: "specificDate" },
        { label: "Relative date", value: "relativeDate" },
    ];

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
                    ].map((item) => {
                        const selected = format === item.value;

                        return (
                            <div
                                key={item.value}
                                className={`chooseItem ${selected ? "active" : ""}`}
                                onClick={() => update("format", item.value)}
                            >
                                {item.label}
                            </div>
                        );
                    })}
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

            {/* DATE SETTINGS */}

            {showDateSettings && (
                <>
                    <Divider />

                    <BlockStack gap="300">

                        <Select
                            label="Date format"
                            options={dateFormatOptions}
                            value={element.dateFormat || "Y-m-d"}
                            onChange={(value) =>
                                update("dateFormat", value)
                            }
                        />

                        <TextField
                            label="Default date"
                            type="date"
                            value={element.defaultDate || ""}
                            onChange={(value) =>
                                update("defaultDate", value)
                            }
                            autoComplete="off"
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
                            <TextField
                                label="Specific date"
                                type="date"
                                value={element.specificStartDate || ""}
                                onChange={(value) =>
                                    update("specificStartDate", value)
                                }
                                autoComplete="off"
                            />
                        )}

                        {element.startDateType === "relativeDate" && (
                            <TextField
                                label="Relative date (days)"
                                type="number"
                                value={String(element.relativeStartDate ?? "")}
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
                            <TextField
                                label="Specific date"
                                type="date"
                                value={element.specificDate || ""}
                                onChange={(value) =>
                                    update("specificDate", value)
                                }
                                autoComplete="off"
                            />
                        )}

                        {element.endDateType === "relativeDate" && (
                            <TextField
                                label="Relative date (days)"
                                type="number"
                                value={String(element.relativeEndDate ?? "")}
                                onChange={(value) =>
                                    update("relativeEndDate", value)
                                }
                                autoComplete="off"
                            />
                        )}

                    </BlockStack>
                </>
            )}

            {/* SPECIFIC DATE */}

            <TextField
                label="Specific date"
                type="date"
                value={element.selectedSpecificDate || ""}
                onChange={(value) =>
                    update("selectedSpecificDate", value)
                }
                autoComplete="off"
            />

            {/* LIMIT DATE PICKER - ONLY FOR DATE FORMAT */}

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

                            <Select
                                label="Limit date type"
                                options={[
                                    { label: "Disabling dates", value: "disable" },
                                    { label: "Enabling dates", value: "enable" },
                                ]}
                                value={element.limitDateType || "disable"}
                                onChange={(value) =>
                                    update("limitDateType", value)
                                }
                            />

                            <Checkbox
                                label="Specific dates"
                                checked={Boolean(element.enableSpecificDates)}
                                onChange={(checked) =>
                                    update("enableSpecificDates", checked)
                                }
                            />

                            {element.enableSpecificDates && (
                                <TextField
                                    label="Select specific dates"
                                    value={element.specificDates || ""}
                                    onChange={(value) =>
                                        update("specificDates", value)
                                    }
                                    placeholder="Y-m-d"
                                    autoComplete="off"
                                />
                            )}

                            <Checkbox
                                label="Range dates"
                                checked={Boolean(element.enableRangeDates)}
                                onChange={(checked) =>
                                    update("enableRangeDates", checked)
                                }
                            />

                            {element.enableRangeDates && (
                                <TextField
                                    label="Select range dates"
                                    value={element.rangeDates || ""}
                                    onChange={(value) =>
                                        update("rangeDates", value)
                                    }
                                    placeholder="Y-m-d"
                                    autoComplete="off"
                                />
                            )}

                            <Checkbox
                                label="Days of week"
                                checked={Boolean(element.enableDaysOfWeek)}
                                onChange={(checked) =>
                                    update("enableDaysOfWeek", checked)
                                }
                            />

                            {element.enableDaysOfWeek && (
                                <Select
                                    label="Target days of week"
                                    options={[
                                        { label: "All days", value: "all" },
                                        { label: "Weekdays", value: "weekdays" },
                                        { label: "Weekends", value: "weekends" },
                                        { label: "Saturday", value: "saturday" },
                                        { label: "Sunday", value: "sunday" },
                                    ]}
                                    value={element.targetDayType || "all"}
                                    onChange={(value) =>
                                        update("targetDayType", value)
                                    }
                                />
                            )}

                        </BlockStack>
                    )}

                    <Checkbox
                        label="Only show month"
                        checked={Boolean(element.onlyShowMonth)}
                        onChange={(checked) =>
                            update("onlyShowMonth", checked)
                        }
                    />
                </>
            )}

            {/* TIME SETTINGS */}


            {/* TIME SETTINGS */}

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
                                {[
                                    { label: "Time picker", value: "picker" },
                                    { label: "Dropdown", value: "dropdown" },
                                ].map((item) => {
                                    const selected =
                                        (element.timeType || "picker") === item.value;

                                    return (
                                        <div
                                            key={item.value}
                                            className={`chooseItem ${selected ? "active" : ""}`}
                                            onClick={() => update("timeType", item.value)}
                                        >
                                            {item.label}
                                        </div>
                                    );
                                })}
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

                        <Checkbox
                            label="Start time"
                            checked={element.enableStartTime !== false}
                            onChange={(checked) =>
                                update("enableStartTime", checked)
                            }
                        />

                        {element.enableStartTime !== false && (
                            <TextField
                                type="time"
                                value={element.startTime || "12:00"}
                                onChange={(value) =>
                                    update("startTime", value)
                                }
                                autoComplete="off"
                            />
                        )}

                        {/* END TIME */}

                        <Checkbox
                            label="End time"
                            checked={element.enableEndTime !== false}
                            onChange={(checked) =>
                                update("enableEndTime", checked)
                            }
                        />

                        {element.enableEndTime !== false && (
                            <TextField
                                type="time"
                                value={element.endTime || "00:00"}
                                onChange={(value) =>
                                    update("endTime", value)
                                }
                                autoComplete="off"
                            />
                        )}

                    </BlockStack>
                </>
            )}

           

        </BlockStack>
    );
};

export default DateSettings;
