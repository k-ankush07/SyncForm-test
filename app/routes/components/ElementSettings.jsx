
import React, { useState } from "react";
import SelectIcon from "./SelectIcon";
import { Icon } from "@shopify/polaris";
import * as PolarisIcons from "@shopify/polaris-icons";
import {
    BlockStack,
    TextField,
    Checkbox,
    Select,
    Divider,
    Text,
    Box,
    InlineStack,
    Button,
} from "@shopify/polaris";

import { ArrowLeftIcon } from "@shopify/polaris-icons";

import ContactSettings from "./elementsettings/groups/ContactSettings";
import TextSettings from "./elementsettings/groups/TextSettings";
import ChoiceSettings from "./elementsettings/groups/ChoiceSettings";
import NumberSettings from "./elementsettings/groups/NumberSettings";
import DateSettings from "./elementsettings/groups/DateSettings";
import FileSettings from "./elementsettings/groups/FileUploadSettings";
// import RatingSettings from "./groups/RatingSettings";
// import ContentSettings from "./groups/ContentSettings";
// import ImageChoiceSettings from "./groups/ImageChoiceSettings";

import { getElementSettingsType } from "./elementsettings/utils/elementSettingsConfig";


/* =========================================
   COMMON SETTINGS - ALL ELEMENTS
========================================= */

function CommonSettings({ element, onChange, onOpenSelectIcon }) {

    // =========================================
    // LOCAL UI STATE
    // =========================================

    const [optionsExpanded, setOptionsExpanded] = useState(true);
    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [bulkOptionsText, setBulkOptionsText] = useState("");


    // =========================================
    // UPDATE ELEMENT
    // =========================================

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };


    // =========================================
    // NORMALIZE ELEMENT TYPE
    // =========================================

    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");


    // Contact types
    const isName = ["name", "first_name", "last_name"].includes(type);
    const isEmail = type === "email";
    const isPhone = ["phone", "tel"].includes(type);
    const isPassword = type === "password";

    const isContactInput =
        isName || isEmail || isPhone || isPassword;


    // Choice types
    const isDropdown = ["dropdown", "select"].includes(type);

    const isRadio = ["radio", "radio_group"].includes(type);

    const isCheckbox = [
        "checkbox",
        "checkbox_group",
        "checkboxes",
    ].includes(type);

    const isChoiceInput =
        isDropdown || isRadio || isCheckbox;


    // =========================================
    // CONDITIONAL SETTINGS
    // =========================================

    const showDefaultValue =
        isName || isEmail || isPhone || isChoiceInput;

    const showKeepLabelPosition =
        isEmail || isPhone || isPassword || isChoiceInput;

    const showCharacterLimit = isContactInput;

    const showSelectIcon = isContactInput;

    const showRequiredNote =
        isContactInput || isChoiceInput;

    const showOtherOption = isRadio || isCheckbox;

    const showOptionsPerLine = isRadio || isCheckbox;

    const showLimitSelections = isCheckbox;


    // =========================================
    // CHOICE OPTIONS DATA
    // =========================================

    const options = Array.isArray(element.options)
        ? element.options
        : [];


    // Add option
    const addOption = () => {

        const newIndex = options.length + 1;

        const newOption = {
            id: `option-${Date.now()}`,
            label: `Option ${newIndex}`,
            value: `option_${newIndex}`,
        };

        update("options", [...options, newOption]);
    };


    // Update option
    const updateOption = (index, value) => {

        const updatedOptions = options.map((option, i) =>
            i === index
                ? {
                    ...option,
                    label: value,
                    value: value,
                }
                : option
        );

        update("options", updatedOptions);
    };


    // Delete option
    const deleteOption = (index) => {

        const updatedOptions = options.filter(
            (_, i) => i !== index
        );

        update("options", updatedOptions);
    };


    // Bulk add options
    const bulkAddOptions = () => {

        const newOptions = bulkOptionsText
            .split("\n")
            .map((label) => label.trim())
            .filter(Boolean)
            .map((label, index) => ({
                id: `option-${Date.now()}-${index}`,
                label,
                value: label,
            }));

        if (newOptions.length > 0) {
            update("options", [...options, ...newOptions]);
        }

        setBulkOptionsText("");
        setBulkAddOpen(false);
    };


    // =========================================
    // CHOICE SETTINGS HELPER FUNCTION
    // =========================================

    const renderChoiceSettings = () => {

        if (!isChoiceInput) return null;

        return (
            <BlockStack gap="300">

                {/* OPTIONS */}

                <Box
                    borderColor="border"
                    borderWidth="025"
                    borderRadius="200"
                    padding="200"
                >

                    <BlockStack gap="300">

                        {/* Options header */}

                        <InlineStack
                            align="space-between"
                            blockAlign="center"
                        >

                            <Text variant="bodyMd">
                                Options
                            </Text>

                            <Button
                                variant="plain"
                                onClick={() =>
                                    setOptionsExpanded(!optionsExpanded)
                                }
                            >
                                {optionsExpanded ? "Collapse" : "Expand"}
                            </Button>

                        </InlineStack>


                        {optionsExpanded && (

                            <BlockStack gap="200">

                                {/* Option label heading */}

                                {/* OPTION LABEL HEADING */}

                                <InlineStack
                                    align="center"
                                    blockAlign="center"
                                    gap="200"
                                    wrap={false}
                                >
                                    {/* Empty space for drag handle */}
                                    <Box width="12px" />

                                    {/* Center label above input */}
                                    <Box flex="1">
                                        <InlineStack
                                            align="center"
                                            blockAlign="center"
                                            gap="100"
                                        >
                                            <Text variant="bodySm">
                                                Option Label
                                            </Text>

                                            <Icon
                                                source={PolarisIcons.InfoIcon}
                                                tone="subdued"
                                            />
                                        </InlineStack>
                                    </Box>

                                    {/* Empty space for delete icon */}
                                    <Box width="20px" />
                                </InlineStack>


                                {/* Options list */}

                                {options.map((option, index) => (

                                    <InlineStack
                                        key={option.id || index}
                                        align="center"
                                        blockAlign="center"
                                        gap="200"
                                    >

                                        {/* Drag handle */}

                                        <Box width="12px">
                                            <Text tone="subdued">
                                                ⠿
                                            </Text>
                                        </Box>


                                        {/* Option input */}

                                        <Box flex="1">
                                            <TextField
                                                label={`Option ${index + 1}`}
                                                labelHidden
                                                value={option.label || ""}
                                                suffix="en"
                                                onChange={(value) => updateOption(index, value)}
                                                autoComplete="off"
                                            />
                                        </Box>


                                        {/* Delete */}

                                        <Button
                                            variant="plain"
                                            tone="critical"
                                            icon={PolarisIcons.DeleteIcon}
                                            accessibilityLabel={`Delete option ${index + 1}`}
                                            onClick={() =>
                                                deleteOption(index)
                                            }
                                        />

                                    </InlineStack>

                                ))}


                                {/* Add buttons */}

                                <InlineStack gap="200">

                                    <Button size="slim" onClick={addOption}>
                                        Add Option
                                    </Button>

                                    <Button
                                        size="slim"
                                        onClick={() => setBulkAddOpen(!bulkAddOpen)}
                                    >
                                        Bulk add Option
                                    </Button>

                                </InlineStack>


                                {/* Bulk add */}

                                {bulkAddOpen && (

                                    <BlockStack gap="200">

                                        <TextField
                                            label="Add multiple options"
                                            value={bulkOptionsText}
                                            onChange={setBulkOptionsText}
                                            multiline={4}
                                            placeholder={"Option 1\nOption 2\nOption 3"}
                                            autoComplete="off"
                                        />

                                        <InlineStack align="end">

                                            <Button
                                                variant="primary"
                                                disabled={!bulkOptionsText.trim()}
                                                onClick={bulkAddOptions}
                                            >
                                                Add options
                                            </Button>

                                        </InlineStack>

                                    </BlockStack>

                                )}

                            </BlockStack>

                        )}

                    </BlockStack>

                </Box>


                {/* OTHER OPTION - RADIO AND CHECKBOX */}

                {showOtherOption && (

                    <BlockStack gap="200">

                        <Checkbox
                            label="Other option"
                            checked={Boolean(element.otherOption)}
                            onChange={(value) =>
                                update("otherOption", value)
                            }
                        />

                        {element.otherOption && (

                            <BlockStack gap="200">

                                <TextField
                                    label="Other label"
                                    value={element.otherLabel || ""}
                                    onChange={(value) =>
                                        update("otherLabel", value)
                                    }
                                    autoComplete="off"
                                />

                                <TextField
                                    label="Other placeholder"
                                    value={element.otherPlaceholder || ""}
                                    onChange={(value) =>
                                        update("otherPlaceholder", value)
                                    }
                                    autoComplete="off"
                                />

                            </BlockStack>

                        )}

                    </BlockStack>

                )}


                {/* OPTIONS PER LINE */}

                {showOptionsPerLine && (
                    <BlockStack gap="200">

                        <Text variant="bodyMd">
                            Number of options per line
                        </Text>

                        <div className="column-width-selector">
                            {[5, 4, 3, 2, 1].map((number) => (
                                <div
                                    key={number}
                                    className={`chooseItem ${Number(element.optionsPerLine || 1) === number
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() => update("optionsPerLine", number)}
                                >
                                    {number}
                                </div>
                            ))}
                        </div>

                    </BlockStack>
                )}

                {/* LIMIT SELECTIONS - CHECKBOX ONLY */}

                {showLimitSelections && (

                    <BlockStack gap="200">

                        <Checkbox
                            label="Limit selections"
                            checked={Boolean(element.limitSelections)}
                            onChange={(value) =>
                                update("limitSelections", value)
                            }
                        />

                        {element.limitSelections && (

                            <BlockStack gap="200">

                                <TextField
                                    label="Minimum selections"
                                    type="number"
                                    value={String(element.minSelections ?? "")}
                                    onChange={(value) =>
                                        update("minSelections", value)
                                    }
                                    autoComplete="off"
                                />

                                <TextField
                                    label="Maximum selections"
                                    type="number"
                                    value={String(element.maxSelections ?? "")}
                                    onChange={(value) =>
                                        update("maxSelections", value)
                                    }
                                    autoComplete="off"
                                />

                            </BlockStack>

                        )}

                    </BlockStack>

                )}

            </BlockStack>
        );
    };


    // =========================================
    // UI
    // =========================================

    return (

        <BlockStack gap="300">

            {/* =================================
                LABEL
            ================================= */}

            <TextField
                label="Label"
                value={element.label || ""}
                onChange={(value) => update("label", value)}
                autoComplete="off"
            />


            {/* =================================
                CHOICE OPTIONS
            ================================= */}

            {renderChoiceSettings()}


            {/* =================================
                PLACEHOLDER - CONTACT
            ================================= */}

            {isContactInput && (

                <TextField
                    label="Placeholder"
                    value={element.placeholder || ""}
                    onChange={(value) => update("placeholder", value)}
                    autoComplete="off"
                />

            )}


            {/* =================================
                DEFAULT VALUE
            ================================= */}

            {showDefaultValue && (

                <TextField
                    label="Enter default value"
                    value={element.defaultValue || ""}
                    onChange={(value) =>
                        update("defaultValue", value)
                    }
                    multiline={isChoiceInput ? 4 : false}
                    autoComplete="off"
                />

            )}


            {/* =================================
                DESCRIPTION
            ================================= */}

            <TextField
                label="Description"
                value={element.description || ""}
                onChange={(value) => update("description", value)}
                multiline={3}
                autoComplete="off"
            />


            {/* =================================
                CHARACTER LIMIT - CONTACT
            ================================= */}

            {showCharacterLimit && (

                <BlockStack gap="200">

                    <Checkbox
                        label="Limit characters"
                        checked={element.limitCharacters || false}
                        onChange={(value) =>
                            update("limitCharacters", value)
                        }
                    />

                    {element.limitCharacters && (

                        <div className="character-limit-settings">

                            <div className="character-limit-settings__fields">

                                <TextField
                                    label="Min characters"
                                    type="number"
                                    value={String(element.minCharacters ?? "")}
                                    onChange={(value) =>
                                        update("minCharacters", value)
                                    }
                                    autoComplete="off"
                                />

                                <TextField
                                    label="Max characters"
                                    type="number"
                                    value={String(element.maxCharacters ?? "")}
                                    onChange={(value) =>
                                        update("maxCharacters", value)
                                    }
                                    autoComplete="off"
                                />

                            </div>

                            <Text as="p" tone="subdued">
                                Note: If you don't want to set a maximum
                                number of characters, leave this field
                                blank instead of setting it to 0.
                            </Text>

                        </div>

                    )}

                </BlockStack>

            )}


            <Divider />


            {/* =================================
                LABEL SETTINGS
            ================================= */}

            <Checkbox
                label="Hide label"
                checked={element.hideLabel || false}
                onChange={(value) =>
                    update("hideLabel", value)
                }
            />


            {showKeepLabelPosition && (

                <Checkbox
                    label="Keep position of label"
                    checked={element.keepLabelPosition || false}
                    onChange={(value) =>
                        update("keepLabelPosition", value)
                    }
                />

            )}


            {/* =================================
                REQUIRED SETTINGS
            ================================= */}

            <Checkbox
                label="Required"
                checked={element.required || false}
                onChange={(value) =>
                    update("required", value)
                }
            />


            {element.required && (

                <TextField
                    label="Required error message"
                    value={element.requiredMessage || ""}
                    onChange={(value) =>
                        update("requiredMessage", value)
                    }
                    autoComplete="off"
                    helpText="Shown when this field is required and left empty on submit."
                />

            )}


            {showRequiredNote && (

                <Checkbox
                    label="Show required note if hide label?"
                    checked={element.showRequiredNote || false}
                    onChange={(value) =>
                        update("showRequiredNote", value)
                    }
                />

            )}


            <Divider />


            {/* =================================
                SELECT ICON - CONTACT
            ================================= */}

            {showSelectIcon && (

                <BlockStack gap="200">

                    <Text as="p" variant="bodyMd">
                        Select icon
                    </Text>

                    <Button
                        fullWidth
                        onClick={onOpenSelectIcon}
                    >
                        {element.selectIcon &&
                            PolarisIcons[element.selectIcon] ? (

                            <Icon
                                source={PolarisIcons[element.selectIcon]}
                                tone="base"
                            />

                        ) : (
                            "Select icon"
                        )}

                    </Button>

                </BlockStack>

            )}


            <Divider />


            {/* =================================
                LAYOUT SETTINGS
            ================================= */}

            <BlockStack gap="200">

                <Text as="p" variant="bodyMd">
                    Column width
                </Text>

                <div className="column-width-selector">

                    {["33", "50", "100"].map((width) => {

                        const selected =
                            String(element.columnWidth || "100") === width;

                        return (

                            <button
                                key={width}
                                type="button"
                                className={`column-width-selector__option ${selected ? "is-selected" : ""
                                    }`}
                                onClick={() =>
                                    update("columnWidth", width)
                                }
                            >
                                {width}%

                            </button>

                        );

                    })}

                </div>

            </BlockStack>


            {/* =================================
                CUSTOM CSS CLASS
            ================================= */}

            <TextField
                label="Custom CSS class"
                value={element.customClass || ""}
                onChange={(value) =>
                    update("customClass", value)
                }
                autoComplete="off"
            />

        </BlockStack>

    );
}


/* =========================================
   ELEMENT SETTINGS CONTROLLER
========================================= */

export default function ElementSettings({ element, onChange, onClose }) {

    // to show icon
    const [activeSection, setActiveSection] = useState("main");

    if (!element) return null;

    // Get group name from config
    const groupType = getElementSettingsType(element.type);

    console.log("========== ELEMENT SETTINGS ==========");
    console.log("Element:", element);
    console.log("Element type:", element.type);
    console.log("Settings group:", groupType);
    console.log("======================================");

    // Select component according to group
    const settingsGroups = {
        contact: ContactSettings,
        text: TextSettings,
        choice: ChoiceSettings,
        number: NumberSettings,
        date: DateSettings,
        file: FileSettings,
        // rating: RatingSettings,
        // content: ContentSettings,
        // imageChoice: ImageChoiceSettings,
    };

    const GroupComponent = settingsGroups[groupType];


    /* =========================================
       SELECT ICON SECTION
    ========================================= */

    if (activeSection === "selectIcon") {
        return (
            <div className="element-settings">

                <SelectIcon
                    value={element.selectIcon || ""}
                    onChange={(value) =>
                        onChange({
                            ...element,
                            selectIcon: value,
                        })
                    }
                    onBack={() => setActiveSection("main")}
                />

            </div>
        );
    }


    return (
        <div className="element-settings">

            {/* Fixed header */}
            <div className="element-settings__header">
                <Box paddingBlock="300">
                    <InlineStack align="start" blockAlign="center" gap="200">
                        <Button
                            icon={ArrowLeftIcon}
                            variant="plain"
                            onClick={onClose}
                            accessibilityLabel="Back to elements"
                        />

                        <Text variant="headingMd" as="h2">
                            {element.label || element.type}
                        </Text>
                    </InlineStack>
                </Box>

                <Divider />
            </div>

            {/* Scrollable content */}
            <div className="element-settings__content">

                <BlockStack gap="400">

                    <CommonSettings
                        element={element}
                        onChange={onChange}
                        onOpenSelectIcon={() =>
                            setActiveSection("selectIcon")
                        }
                    />

                    <Divider />

                    {GroupComponent && (
                        <GroupComponent
                            element={element}
                            onChange={onChange}
                        />
                    )}

                </BlockStack>

            </div>

        </div>
    );
}
