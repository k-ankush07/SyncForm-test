
import React from "react";

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

function CommonSettings({ element, onChange }) {

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    // type specific to hide some settings from common settings
    const type = String(element.type || "").toLowerCase();

    const isName = type === "name" || "first_name";
    const isEmail = type === "email";
    const isPhone = type === "phone";
    const isPassword = type === "password";

    const isContactInput = isName || isEmail || isPhone || isPassword;

    // Settings visibility based on input type
    const showDefaultValue = isName || isEmail || isPhone;

    const showKeepLabelPosition = isEmail || isPhone || isPassword;

    const showCharacterLimit = isName || isEmail || isPhone || isPassword;

    const showSelectIcon = isContactInput;

    const showRequiredNote = isContactInput;

    return (
        <BlockStack gap="300">

            {/* =================================
                GENERAL SETTINGS
            ================================= */}

            <TextField
                label="Label"
                value={element.label || ""}
                onChange={(value) => update("label", value)}
                autoComplete="off"
            />

            {/* Placeholder - Contact inputs */}
            {isContactInput && (
                <TextField
                    label="Placeholder"
                    value={element.placeholder || ""}
                    onChange={(value) => update("placeholder", value)}
                    autoComplete="off"
                />
            )}

            <TextField
                label="Description"
                value={element.description || ""}
                onChange={(value) => update("description", value)}
                multiline={3}
                autoComplete="off"
            />

            {/* Default value - Name, Email, Phone */}
            {showDefaultValue && (
                <TextField
                    label="Default value"
                    value={element.defaultValue || ""}
                    onChange={(value) => update("defaultValue", value)}
                    autoComplete="off"
                />
            )}

            {/* =================================
                CHARACTER LIMIT SETTINGS
            ================================= */}

            {showCharacterLimit && (
                <>
                    <Checkbox
                        label="Limit characters"
                        checked={element.limitCharacters || false}
                        onChange={(value) => update("limitCharacters", value)}
                    />

                    {element.limitCharacters && (
                        <BlockStack gap="200">

                            <TextField
                                label="Min characters"
                                type="number"
                                value={String(element.minCharacters ?? "")}
                                onChange={(value) => update("minCharacters", value)}
                                autoComplete="off"
                            />

                            <TextField
                                label="Max characters"
                                type="number"
                                value={String(element.maxCharacters ?? "")}
                                onChange={(value) => update("maxCharacters", value)}
                                autoComplete="off"
                                helpText="If you don't want to set a maximum number of characters, leave this field blank instead of setting it to 0."
                            />

                        </BlockStack>
                    )}
                </>
            )}

            <Divider />

            {/* =================================
                LABEL SETTINGS
            ================================= */}

            <Checkbox
                label="Hide label"
                checked={element.hideLabel || false}
                onChange={(value) => update("hideLabel", value)}
            />

            {/* Keep position - Email, Phone, Password */}
            {showKeepLabelPosition && (
                <Checkbox
                    label="Keep position of label"
                    checked={element.keepLabelPosition || false}
                    onChange={(value) => update("keepLabelPosition", value)}
                />
            )}

            {/* =================================
                REQUIRED SETTINGS
            ================================= */}

            <Checkbox
                label="Required"
                checked={element.required || false}
                onChange={(value) => update("required", value)}
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

            {/* Show required note - Contact inputs */}
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
                CONTACT INPUT SETTINGS
            ================================= */}

            {/* Select icon - Name, Email, Phone, Password */}
            {showSelectIcon && (
                <Select
                    label="Select icon"
                    value={element.selectIcon || ""}
                    options={[
                        { label: "No icon", value: "" },
                        { label: "Person", value: "person" },
                        { label: "Email", value: "email" },
                        { label: "Phone", value: "phone" },
                        { label: "Lock", value: "lock" },
                    ]}
                    onChange={(value) => update("selectIcon", value)}
                />
            )}

            <Divider />

            {/* =================================
                LAYOUT SETTINGS
            ================================= */}

            <Select
                label="Column width"
                value={String(element.columnWidth || "100")}
                options={[
                    { label: "100%", value: "100" },
                    { label: "75%", value: "75" },
                    { label: "50%", value: "50" },
                    { label: "33%", value: "33" },
                    { label: "25%", value: "25" },
                ]}
                onChange={(value) => update("columnWidth", value)}
            />

            <TextField
                label="Custom CSS class"
                value={element.customClass || ""}
                onChange={(value) => update("customClass", value)}
                autoComplete="off"
            />

        </BlockStack>
    );
}


/* =========================================
   ELEMENT SETTINGS CONTROLLER
========================================= */

export default function ElementSettings({ element, onChange, onClose }) {

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
