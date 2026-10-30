
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
// import ChoiceSettings from "./groups/ChoiceSettings";
// import NumberSettings from "./groups/NumberSettings";
// import DateSettings from "./groups/DateSettings";
// import FileSettings from "./groups/FileSettings";
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

    return (
        <BlockStack gap="300">

            {/* <Text variant="headingMd" as="h3">
                General settings
            </Text> */}

            <TextField
                label="Label"
                value={element.label || ""}
                onChange={(value) => update("label", value)}
                autoComplete="off"
            />

            <TextField
                label="Description"
                value={element.description || ""}
                onChange={(value) => update("description", value)}
                multiline={3}
                autoComplete="off"
            />

            <Checkbox
                label="Hide label"
                checked={element.hideLabel || false}
                onChange={(value) => update("hideLabel", value)}
            />

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
                />
            )}

            <Divider />

            {/* <Text variant="headingMd" as="h3">
                Layout settings
            </Text> */}

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

    // Select component according to group
    const settingsGroups = {
        contact: ContactSettings,
        text: TextSettings,
        // choice: ChoiceSettings,
        // number: NumberSettings,
        // date: DateSettings,
        // file: FileSettings,
        // rating: RatingSettings,
        // content: ContentSettings,
        // imageChoice: ImageChoiceSettings,
    };

    const GroupComponent = settingsGroups[groupType];

    return (
        <BlockStack gap="400">

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

            {/* Common settings for every element */}
            <CommonSettings
                element={element}
                onChange={onChange}
            />

            <Divider />

            {/* Settings according to selected element group */}
            {GroupComponent && (
                <GroupComponent
                    element={element}
                    onChange={onChange}
                />
            )}

        </BlockStack>
    );
}
