import React from "react";

import {
    BlockStack,
    InlineStack,
    Text,
    TextField,
    Checkbox,
    Button,
    Box,
    Divider,
} from "@shopify/polaris";

const NumberSettings = ({ element, onChange, onOpenIconPicker }) => {
    const isQuantity = element.type === "quantity";

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    return (
        <BlockStack gap="400">

            {/* Placeholder */}
            {!isQuantity && (
                <TextField
                    label="Placeholder"
                    value={element.placeholder || ""}
                    onChange={(value) => update("placeholder", value)}
                    autoComplete="off"
                />
            )}

            {/* Default Value */}
            {!isQuantity && (
                <TextField
                    label="Default value"
                    value={element.defaultValue || ""}
                    onChange={(value) => update("defaultValue", value)}
                    autoComplete="off"
                />
            )}

            {/* Minimum Value */}
            <BlockStack gap="200">
                <Checkbox
                    label="Set min value"
                    checked={Boolean(element.setMinValue)}
                    onChange={(checked) => update("setMinValue", checked)}
                />

                {element.setMinValue && (
                    <TextField
                        label="Minimum value"
                        labelHidden
                        type="number"
                        value={String(element.minValue ?? "")}
                        onChange={(value) => update("minValue", value)}
                        placeholder="Enter minimum value"
                        autoComplete="off"
                    />
                )}
            </BlockStack>

            {/* Maximum Value */}
            <BlockStack gap="200">
                <Checkbox
                    label="Set max value"
                    checked={Boolean(element.setMaxValue)}
                    onChange={(checked) => update("setMaxValue", checked)}
                />

                {element.setMaxValue && (
                    <TextField
                        label="Maximum value"
                        labelHidden
                        type="number"
                        value={String(element.maxValue ?? "")}
                        onChange={(value) => update("maxValue", value)}
                        placeholder="Enter maximum value"
                        autoComplete="off"
                    />
                )}
            </BlockStack>

            <Divider />



        </BlockStack>
    );
};

export default NumberSettings;