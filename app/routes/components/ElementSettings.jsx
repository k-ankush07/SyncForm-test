// common setting show for all and additional settings for the seleceted elements 
import React from "react";
import {
    Box,
    BlockStack,
    InlineStack,
    Text,
    TextField,
    Checkbox,
    Select,
    Divider,
    Button,
    ChoiceList
} from "@shopify/polaris";

import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { getElementSettingsType } from "../../utils/elementSettingsConfig.js";

// Reusable helper for updating one setting.
function updateSetting(element, onChange, key, value) {
    onChange({
        ...element,
        [key]: value,
    });
}

// Reusable text input.
function SettingTextField({
    label,
    value,
    onChange,
    helpText,
    type = "text",
    ...props
}) {
    return (
        <TextField
            label={label}
            value={value ?? ""}
            onChange={onChange}
            helpText={helpText}
            type={type}
            autoComplete="off"
            {...props}
        />
    );
}

// --------------------------------------------------
// COMMON SETTINGS
// These settings are shared by almost every element.
// --------------------------------------------------
function CommonSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    return (
        <BlockStack gap="400">
            <SettingTextField
                label="Label"
                value={element.label}
                onChange={(value) => set("label", value)}
            />

            <SettingTextField
                label="Description"
                value={element.description}
                onChange={(value) => set("description", value)}
                multiline={2}
            />

            <Checkbox
                label="Hide label"
                checked={Boolean(element.hideLabel)}
                onChange={(value) => set("hideLabel", value)}
            />

            <Checkbox
                label="Required"
                checked={Boolean(element.required)}
                onChange={(value) => set("required", value)}
            />

            {element.required && (
                <>
                    <SettingTextField
                        label="Required error message"
                        value={element.requiredMessage}
                        onChange={(value) => set("requiredMessage", value)}
                        helpText="Shown when the required field is left empty."
                    />

                    <Checkbox
                        label="Show required note if label is hidden"
                        checked={Boolean(element.ifHideLabel)}
                        onChange={(value) => set("ifHideLabel", value)}
                    />
                </>
            )}

            <Divider />

            <Text as="h3" variant="headingSm">
                Layout
            </Text>

            {/* // choice list */}
            <div className="column-width-setting">
                <Text as="p" variant="bodyMd">
                    Column width
                </Text>

                <div className="column-width-selector">
                    {[33, 50, 100].map((width) => (
                        <button
                            key={width}
                            type="button"
                            className={`column-width-option ${Number(element.columnWidth ?? 100) === width
                                ? "column-width-option--active"
                                : ""
                                }`}
                            onClick={() => set("columnWidth", width)}
                        >
                            {width}%
                        </button>
                    ))}
                </div>
            </div>


            <SettingTextField
                label="Custom CSS class"
                value={element.customClass}
                onChange={(value) => set("customClass", value)}
                helpText="Optional class name for custom styling."
            />
        </BlockStack>
    );
}

// --------------------------------------------------
// TEXT SETTINGS
// Text, name, textarea and similar inputs.
// --------------------------------------------------
function TextSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    return (
        <BlockStack gap="400">
            <SettingTextField
                label="Placeholder"
                value={element.placeholder}
                onChange={(value) => set("placeholder", value)}
            />

            <SettingTextField
                label="Default value"
                value={element.defaultValue}
                onChange={(value) => set("defaultValue", value)}
                multiline={element.type === "textarea" ? 3 : false}
            />

            <Checkbox
                label="Limit characters"
                checked={Boolean(element.limitCharacters)}
                onChange={(value) => set("limitCharacters", value)}
            />

            {element.limitCharacters && (
                <>
                    <SettingTextField
                        label="Minimum characters"
                        type="number"
                        value={String(element.minCharacters ?? "")}
                        onChange={(value) =>
                            set(
                                "minCharacters",
                                value === "" ? "" : Math.max(0, Number(value))
                            )
                        }
                    />

                    <SettingTextField
                        label="Maximum characters"
                        type="number"
                        value={String(element.maxCharacters ?? "")}
                        onChange={(value) =>
                            set(
                                "maxCharacters",
                                value === "" ? "" : Math.max(0, Number(value))
                            )
                        }
                    />
                </>
            )}
        </BlockStack>
    );
}

// --------------------------------------------------
// EMAIL SETTINGS
// --------------------------------------------------
function EmailSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    return (
        <BlockStack gap="400">
            {/* Placeholder */}
            <SettingTextField
                label="Placeholder"
                value={element.placeholder}
                onChange={(value) => set("placeholder", value)}
            />

            {/* Confirm email */}
            <Checkbox
                label="Also create confirm email input"
                checked={Boolean(element.hasConfirm)}
                onChange={(value) => set("hasConfirm", value)}
            />

            {element.hasConfirm && (
                <BlockStack gap="300">
                    <Divider />

                    <Text as="h3" variant="headingSm">
                        Confirm email settings
                    </Text>

                    <SettingTextField
                        label="Label confirm"
                        value={element.confirmLabel}
                        onChange={(value) => set("confirmLabel", value)}
                    />

                    <SettingTextField
                        label="Placeholder confirm"
                        value={element.confirmPlaceholder}
                        onChange={(value) => set("confirmPlaceholder", value)}
                    />

                    <SettingTextField
                        label="Description confirm"
                        value={element.confirmDescription}
                        onChange={(value) => set("confirmDescription", value)}
                        multiline={2}
                    />
                </BlockStack>
            )}

            <Divider />

            {/* Default value */}
            <SettingTextField
                label="Default value"
                value={element.defaultValue}
                onChange={(value) => set("defaultValue", value)}
            />

            {/* Character limit */}
            <Checkbox
                label="Limit characters"
                checked={Boolean(element.limitCharacters)}
                onChange={(value) => set("limitCharacters", value)}
            />

            {element.limitCharacters && (
                <BlockStack gap="300">
                    <SettingTextField
                        label="Min characters"
                        type="number"
                        value={String(element.minCharacters ?? "")}
                        onChange={(value) =>
                            set(
                                "minCharacters",
                                value === "" ? "" : Math.max(0, Number(value))
                            )
                        }
                    />

                    <SettingTextField
                        label="Max characters"
                        type="number"
                        value={String(element.maxCharacters ?? "")}
                        onChange={(value) =>
                            set(
                                "maxCharacters",
                                value === "" ? "" : Math.max(0, Number(value))
                            )
                        }
                        helpText="If you don't want to set a maximum number of characters, leave this field blank instead of setting it to 0."
                    />
                </BlockStack>
            )}
        </BlockStack>
    );
}

// --------------------------------------------------
// PHONE SETTINGS
// --------------------------------------------------
function PhoneSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    const countryOptions = [
        { label: "India (+91)", value: "IN" },
        { label: "United States (+1)", value: "US" },
        { label: "United Kingdom (+44)", value: "GB" },
        { label: "Canada (+1)", value: "CA" },
        { label: "Australia (+61)", value: "AU" },
        { label: "Germany (+49)", value: "DE" },
        { label: "France (+33)", value: "FR" },
    ];

    return (
        <BlockStack gap="400">
            {/* Placeholder */}
            <SettingTextField
                label="Placeholder"
                value={element.placeholder}
                onChange={(value) => set("placeholder", value)}
            />

            {/* Default value */}
            <SettingTextField
                label="Default value"
                value={element.defaultValue}
                onChange={(value) => set("defaultValue", value)}
            />

            <Divider />

            {/* International phone validation */}
            <Checkbox
                label="Validate international telephone numbers"
                checked={Boolean(element.phoneValidation)}
                onChange={(value) => set("phoneValidation", value)}
                helpText="Enable country flags and international dialing codes."
            />

            {/* Default country */}
            {element.phoneValidation && (
                <Select
                    label="Select default country"
                    options={countryOptions}
                    value={element.defaultCountry || "IN"}
                    onChange={(value) => set("defaultCountry", value)}
                />
            )}

            <Divider />

            {/* Character limit */}
            <Checkbox
                label="Limit characters"
                checked={Boolean(element.limitCharacters)}
                onChange={(value) => set("limitCharacters", value)}
            />

            {element.limitCharacters && (
                <BlockStack gap="300">
                    <SettingTextField
                        label="Min characters"
                        type="number"
                        value={String(element.minCharacters ?? "")}
                        onChange={(value) =>
                            set(
                                "minCharacters",
                                value === "" ? "" : Math.max(0, Number(value))
                            )
                        }
                    />

                    <SettingTextField
                        label="Max characters"
                        type="number"
                        value={String(element.maxCharacters ?? "")}
                        onChange={(value) =>
                            set(
                                "maxCharacters",
                                value === "" ? "" : Math.max(0, Number(value))
                            )
                        }
                        helpText="Leave blank if you don't want to set a maximum."
                    />
                </BlockStack>
            )}

            <Divider />

            {/* Icon */}
            <SettingTextField
                label="Select icon"
                value={element.icon || ""}
                onChange={(value) => set("icon", value)}
                helpText="Icon selection can be connected to an icon picker later."
            />
        </BlockStack>
    );
}

// --------------------------------------------------
// PASSWORD SETTINGS
// --------------------------------------------------

function PasswordSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    const validationOptions = [
        { label: "None", value: "false" },
        { label: "Minimum 6 characters", value: "^.{6,}$" },
        {
            label: "Minimum 6 characters, at least one letter and one number",
            value: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$",
        },
        {
            label: "Minimum 6 characters, at least one letter, one number and one special character",
            value: "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{6,}$",
        },
        {
            label: "Minimum 6 characters, at least one uppercase letter, one lowercase letter and one number",
            value: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$",
        },
        {
            label: "Minimum 6 characters, at least one uppercase letter, one lowercase letter, one number and one special character",
            value: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$",
        },
        { label: "Advanced validate rule", value: "advancedValidateRule" },
    ];

    return (
        <BlockStack gap="400">
            <SettingTextField
                label="Placeholder"
                value={element.placeholder || "Enter your password"}
                onChange={(value) => set("placeholder", value)}
            />

            <Divider />

            <Checkbox
                label="Limit characters"
                checked={Boolean(element.limitCharacters)}
                onChange={(value) => set("limitCharacters", value)}
            />

            {element.limitCharacters && (
                <InlineStack gap="300" wrap={false}>
                    <div style={{ flex: 1 }}>
                        <SettingTextField
                            label="Min characters"
                            type="number"
                            value={String(element.minCharacters ?? "")}
                            onChange={(value) =>
                                set(
                                    "minCharacters",
                                    value === "" ? "" : Math.max(0, Number(value))
                                )
                            }
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <SettingTextField
                            label="Max characters"
                            type="number"
                            value={String(element.maxCharacters ?? "")}
                            onChange={(value) =>
                                set(
                                    "maxCharacters",
                                    value === "" ? "" : Math.max(0, Number(value))
                                )
                            }
                            helpText="Leave blank if you don't want to set a maximum."
                        />
                    </div>
                </InlineStack>
            )}

            <Divider />

            <Select
                label="Validate"
                options={validationOptions}
                value={element.validationRule || "false"}
                onChange={(value) => set("validationRule", value)}
            />

            {element.validationRule === "advancedValidateRule" && (
                <SettingTextField
                    label="Advanced validation rule"
                    value={element.advancedValidateRule || ""}
                    onChange={(value) => set("advancedValidateRule", value)}
                    helpText="Enter your custom regular expression."
                />
            )}

            <Divider />

            <Checkbox
                label="Keep position of label"
                checked={Boolean(element.keepPositionLabel)}
                onChange={(value) => set("keepPositionLabel", value)}
            />

            <Divider />

            <Checkbox
                label="Also create confirm password input"
                checked={Boolean(element.hasConfirm)}
                onChange={(value) => set("hasConfirm", value)}
            />

            {element.hasConfirm && (
                <BlockStack gap="300">
                    <SettingTextField
                        label="Label confirm"
                        value={element.labelConfirm || "Confirm password"}
                        onChange={(value) => set("labelConfirm", value)}
                    />

                    <SettingTextField
                        label="Placeholder confirm"
                        value={element.placeholderConfirm || "Confirm your password"}
                        onChange={(value) => set("placeholderConfirm", value)}
                    />

                    <SettingTextField
                        label="Description confirm"
                        value={element.descriptionConfirm || ""}
                        onChange={(value) => set("descriptionConfirm", value)}
                    />
                </BlockStack>
            )}

            <Checkbox
                label="Storing password for purpose"
                checked={Boolean(element.storePasswordData)}
                onChange={(value) => set("storePasswordData", value)}
            />

            <Divider />

            <SettingTextField
                label="Select icon"
                value={element.icon || ""}
                onChange={(value) => set("icon", value)}
                helpText="Icon selection can be connected to an icon picker later."
            />

            <Divider />

            <Checkbox
                label="Conditional display"
                checked={Boolean(element.conditionalField)}
                onChange={(value) => set("conditionalField", value)}
                disabled
                helpText="This feature is available in our PREMIUM plan."
            />
        </BlockStack>
    );
}
// --------------------------------------------------
// Country SETTINGS
// --------------------------------------------------

function CountrySettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    const countries = [
        "Afghanistan", "Aland Islands", "Albania", "Algeria",
        "Andorra", "Angola", "Anguilla", "Antigua And Barbuda",
        "Argentina", "Armenia", "Aruba", "Australia", "Austria",
        "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh",
        "Barbados", "Belarus", "Belgium", "Belize", "Benin",
        "Bermuda", "Bhutan", "Bolivia", "Bosnia And Herzegovina",
        "Botswana", "Brazil", "Brunei", "Bulgaria", "Cambodia",
        "Cameroon", "Canada", "Chile", "China", "Colombia",
        "Costa Rica", "Croatia", "Cyprus", "Czech Republic",
        "Denmark", "Egypt", "Finland", "France", "Germany",
        "Greece", "Hong Kong", "Hungary", "Iceland", "India",
        "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
        "Italy", "Japan", "Jordan", "Kenya", "Kuwait",
        "Malaysia", "Maldives", "Mexico", "Nepal",
        "Netherlands", "New Zealand", "Nigeria", "Norway",
        "Oman", "Pakistan", "Philippines", "Poland",
        "Portugal", "Qatar", "Romania", "Russia",
        "Saudi Arabia", "Singapore", "South Africa",
        "South Korea", "Spain", "Sri Lanka", "Sweden",
        "Switzerland", "Thailand", "Turkey",
        "United Arab Emirates", "United Kingdom",
        "United States", "Vietnam", "Zambia", "Zimbabwe",
    ];

    const countryOptions = [
        { label: "Please select", value: "" },
        ...countries.map((country) => ({
            label: country,
            value: country,
        })),
    ];

    return (
        <BlockStack gap="400">
            <SettingTextField
                label="Placeholder"
                value={element.placeholder || "Please select"}
                onChange={(value) => set("placeholder", value)}
            />

            <Select
                label="Select default value"
                options={countryOptions}
                value={element.defaultOption || ""}
                onChange={(value) => set("defaultOption", value)}
            />

            <Divider />

            <Checkbox
                label="Enable search"
                checked={Boolean(element.selectWithSearch)}
                onChange={(value) => set("selectWithSearch", value)}
            />

            <Divider />

            <SettingTextField
                label="Select icon"
                value={element.icon || ""}
                onChange={(value) => set("icon", value)}
                helpText="Icon selection can be connected to an icon picker later."
            />

            <Divider />

            <Checkbox
                label="Conditional display"
                checked={Boolean(element.conditionalField)}
                onChange={(value) => set("conditionalField", value)}
                disabled
                helpText="This feature is available in our PREMIUM plan."
            />
        </BlockStack>
    );
}
// --------------------------------------------------
// NUMBER SETTINGS
// --------------------------------------------------
function NumberSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    return (
        <BlockStack gap="400">
            <SettingTextField
                label="Placeholder"
                value={element.placeholder}
                onChange={(value) => set("placeholder", value)}
            />

            <SettingTextField
                label="Default value"
                type="number"
                value={String(element.defaultValue ?? "")}
                onChange={(value) => set("defaultValue", value)}
            />

            <SettingTextField
                label="Minimum value"
                type="number"
                value={String(element.minValue ?? "")}
                onChange={(value) =>
                    set("minValue", value === "" ? "" : Number(value))
                }
            />

            <SettingTextField
                label="Maximum value"
                type="number"
                value={String(element.maxValue ?? "")}
                onChange={(value) =>
                    set("maxValue", value === "" ? "" : Number(value))
                }
            />

            <SettingTextField
                label="Step"
                type="number"
                value={String(element.step ?? 1)}
                onChange={(value) =>
                    set("step", value === "" ? "" : Number(value))
                }
            />
        </BlockStack>
    );
}

// --------------------------------------------------
// DATE SETTINGS
// --------------------------------------------------
function DateSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    return (
        <BlockStack gap="400">
            <SettingTextField
                label="Default date"
                type="date"
                value={element.defaultValue}
                onChange={(value) => set("defaultValue", value)}
            />

            <SettingTextField
                label="Earliest allowed date"
                type="date"
                value={element.minDate}
                onChange={(value) => set("minDate", value)}
            />

            <SettingTextField
                label="Latest allowed date"
                type="date"
                value={element.maxDate}
                onChange={(value) => set("maxDate", value)}
            />
        </BlockStack>
    );
}

// --------------------------------------------------
// FILE UPLOAD SETTINGS
// --------------------------------------------------
function FileSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    return (
        <BlockStack gap="400">
            <SettingTextField
                label="Accepted file types"
                value={element.acceptedFileTypes}
                onChange={(value) => set("acceptedFileTypes", value)}
                helpText="For example: .pdf,.jpg,.png"
            />

            <SettingTextField
                label="Maximum file size (MB)"
                type="number"
                value={String(element.maxFileSize ?? 10)}
                onChange={(value) =>
                    set("maxFileSize", value === "" ? "" : Math.max(0, Number(value)))
                }
            />

            <Select
                label="Allow multiple files"
                options={[
                    { label: "No", value: "false" },
                    { label: "Yes", value: "true" },
                ]}
                value={String(Boolean(element.multipleFiles))}
                onChange={(value) => set("multipleFiles", value === "true")}
            />
        </BlockStack>
    );
}

// --------------------------------------------------
// CHOICE SETTINGS
// Dropdown, radio, checkbox groups.
// --------------------------------------------------
function ChoiceSettings({ element, onChange }) {
    const options = Array.isArray(element.options) ? element.options : [];

    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    const updateOption = (index, label) => {
        const updatedOptions = options.map((option, optionIndex) => {
            if (optionIndex !== index) return option;

            if (typeof option === "string") {
                return { label, value: label };
            }

            return {
                ...option,
                label,
                value: label,
            };
        });

        set("options", updatedOptions);
    };

    const addOption = () => {
        set("options", [
            ...options,
            {
                id: crypto.randomUUID(),
                label: `Option ${options.length + 1}`,
                value: `option-${options.length + 1}`,
            },
        ]);
    };

    const removeOption = (index) => {
        set(
            "options",
            options.filter((_, optionIndex) => optionIndex !== index)
        );
    };

    return (
        <BlockStack gap="400">
            <Text as="h3" variant="headingSm">
                Options
            </Text>

            {options.map((option, index) => {
                const label =
                    typeof option === "string"
                        ? option
                        : option.label ?? option.value ?? "";

                return (
                    <InlineStack key={option.id ?? index} gap="200" align="start">
                        <Box width="100%">
                            <TextField
                                label={`Option ${index + 1}`}
                                labelHidden
                                value={label}
                                onChange={(value) => updateOption(index, value)}
                                autoComplete="off"
                            />
                        </Box>

                        <Button
                            tone="critical"
                            variant="plain"
                            onClick={() => removeOption(index)}
                            disabled={options.length <= 1}
                        >
                            Remove
                        </Button>
                    </InlineStack>
                );
            })}

            <Button onClick={addOption}>Add option</Button>

            <SettingTextField
                label="Default selected value"
                value={element.defaultValue}
                onChange={(value) => set("defaultValue", value)}
            />

            <Select
                label="Options per line"
                options={[
                    { label: "1 per line", value: "1" },
                    { label: "2 per line", value: "2" },
                    { label: "3 per line", value: "3" },
                ]}
                value={String(element.optionsPerLine ?? 1)}
                onChange={(value) => set("optionsPerLine", Number(value))}
            />

            <Checkbox
                label="Allow an 'Other' option"
                checked={Boolean(element.otherOption)}
                onChange={(value) => set("otherOption", value)}
            />
        </BlockStack>
    );
}
//  checkbox groups.
function CheckboxSettings({ element, onChange }) {
    const set = (key, value) =>
        updateSetting(element, onChange, key, value);

    const options = Array.isArray(element.options)
        ? element.options
        : [];

    const updateOption = (index, value) => {
        const updatedOptions = options.map((option, i) => {
            if (i !== index) return option;

            if (typeof option === "string") {
                return {
                    label: value,
                    value: value,
                };
            }

            return {
                ...option,
                label: value,
                value: value,
            };
        });

        set("options", updatedOptions);
    };

    const addOption = () => {
        const newOption = {
            id: crypto.randomUUID(),
            label: `Option ${options.length + 1}`,
            value: `option-${options.length + 1}`,
        };

        set("options", [...options, newOption]);
    };

    const removeOption = (index) => {
        set(
            "options",
            options.filter((_, i) => i !== index)
        );
    };

    return (
        <BlockStack gap="400">

            <Text as="p" variant="bodyMd" fontWeight="medium">
                Options
            </Text>

            {options.map((option, index) => (
                <InlineStack
                    key={option.id || index}
                    gap="200"
                    align="center"
                    wrap={false}
                >
                    <div style={{ flex: 1 }}>
                        <TextField
                            label={`Option ${index + 1}`}
                            labelHidden
                            value={
                                typeof option === "string"
                                    ? option
                                    : option.label || option.value || ""
                            }
                            onChange={(value) =>
                                updateOption(index, value)
                            }
                            autoComplete="off"
                        />
                    </div>

                    <Button
                        icon={DeleteIcon}
                        tone="critical"
                        variant="plain"
                        onClick={() => removeOption(index)}
                        accessibilityLabel="Delete option"
                        disabled={options.length <= 1}
                    />
                </InlineStack>
            ))}

            <ButtonGroup>
                <Button onClick={addOption}>
                    Add Option
                </Button>
            </ButtonGroup>

            <Divider />

            <TextField
                label="Enter default value"
                value={
                    Array.isArray(element.defaultOptions)
                        ? element.defaultOptions.join(", ")
                        : element.defaultOptions || ""
                }
                onChange={(value) =>
                    set("defaultOptions", value)
                }
                multiline={4}
                autoComplete="off"
            />

            <Checkbox
                label="Other option"
                checked={Boolean(element.otherOption)}
                onChange={(value) => set("otherOption", value)}
            />

            <Checkbox
                label="Limit selections"
                checked={Boolean(element.limitSelections)}
                onChange={(value) => set("limitSelections", value)}
            />

            {element.limitSelections && (
                <TextField
                    label="Maximum selections"
                    type="number"
                    value={String(element.maxSelections ?? "")}
                    onChange={(value) =>
                        set(
                            "maxSelections",
                            value === ""
                                ? ""
                                : Math.max(1, Number(value))
                        )
                    }
                    autoComplete="off"
                />
            )}

            <ChoiceList
                title="Number of options per line"
                choices={[
                    { label: "5", value: "5" },
                    { label: "4", value: "4" },
                    { label: "3", value: "3" },
                    { label: "2", value: "2" },
                    { label: "1", value: "1" },
                ]}
                selected={[String(element.optionsPerLine || 1)]}
                onChange={(value) =>
                    set("optionsPerLine", Number(value[0]))
                }
            />

        </BlockStack>
    );
}

// --------------------------------------------------
// ROUTER
// Chooses which type-specific settings to display.
// --------------------------------------------------
function TypeSpecificSettings({ element, onChange }) {
    // here the part page get setting type acc to elemenyt so respective
    const settingsType = getElementSettingsType(element.type);
        console.log("Original type:", element.type);
    console.log("Settings type:", settingsType);

    switch (settingsType) {
        case "text":
            return <TextSettings element={element} onChange={onChange} />;

        case "email":
            return <EmailSettings element={element} onChange={onChange} />;

        case "password":
            return <PasswordSettings element={element} onChange={onChange} />;

        case "country":
            return <CountrySettings element={element} onChange={onChange} />;

        case "phone":
            return <PhoneSettings element={element} onChange={onChange} />;

        case "number":
            return <NumberSettings element={element} onChange={onChange} />;

        case "checkbox":
        case "checkbox_group":
            console.log(element.type, getElementSettingsType(element.type));
            return <CheckboxSettings element={element} onChange={onChange} />;

        case "date":
            return <DateSettings element={element} onChange={onChange} />;

        case "file":
            return <FileSettings element={element} onChange={onChange} />;

        case "choice":
            return <ChoiceSettings element={element} onChange={onChange} />;

        default:
            return (
                <Text as="p" tone="subdued">
                    This element does not have any additional settings yet.
                </Text>
            );
    }
}

// --------------------------------------------------
// MAIN ELEMENT SETTINGS PANEL
// Keep the same component name and props in your editor.
// --------------------------------------------------
export default function ElementSettings({
    element,
    onChange,
    onClose,
}) {
    if (!element) {
        return (
            <Box padding="400">
                <Text as="p" tone="subdued">
                    Select an element to edit its settings.
                </Text>
            </Box>
        );
    }

    return (
        <Box padding="400" height="100%">
            <div className="element-settings">
                {/* Fixed header */}
                <div className="element-settings__header">
                    <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                            <Button
                                icon={ArrowLeftIcon}
                                variant="plain"
                                onClick={onClose}
                                accessibilityLabel="Back to elements"
                            />

                            <Text as="h2" variant="headingMd">
                                {element.label || "Element settings"}
                            </Text>
                        </InlineStack>
                    </InlineStack>
                </div>

                <Divider />

                {/* Scrollable settings */}
                <div className="element-settings__content">
                    <BlockStack gap="400">
                        <Text as="h3" variant="headingSm">
                            General
                        </Text>

                        <CommonSettings
                            element={element}
                            onChange={onChange}
                        />

                        <Divider />

                        <Text as="h3" variant="headingSm">
                            {getElementSettingsType(element.type) === "common"
                                ? "Additional settings"
                                : `${getElementSettingsType(element.type)} settings`}
                        </Text>

                        <TypeSpecificSettings
                            element={element}
                            onChange={onChange}
                        />
                    </BlockStack>
                </div>
            </div>
        </Box>
    );
}
