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
    console.log("number")

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    return (
        <BlockStack gap="400">

            {/* Placeholder */}
            <TextField
                label="Placeholder"
                value={element.placeholder || ""}
                onChange={(value) => update("placeholder", value)}
                autoComplete="off"
            />

            {/* Default Value */}
            <TextField
                label="Default value"
                type="number"
                value={String(element.defaultValue ?? "")}
                onChange={(value) => update("defaultValue", value)}
                autoComplete="off"
            />

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

            {/* Select Icon */}
            <BlockStack gap="200">
                <Text as="span" variant="bodyMd">
                    Select icon
                </Text>

                <InlineStack align="end" gap="300">
                    <Button
                        variant="plain"
                        onClick={onOpenIconPicker}
                    >
                        Change
                    </Button>

                    {element.icon && (
                        <Button
                            variant="plain"
                            tone="critical"
                            onClick={() => update("icon", null)}
                        >
                            Remove
                        </Button>
                    )}
                </InlineStack>

                <Box
                    background="bg-surface-secondary"
                    borderColor="border"
                    borderWidth="025"
                    borderRadius="200"
                    padding="400"
                >
                    <BlockStack align="center">
                        {element.icon ? (
                            <Text as="span" variant="bodyMd">
                                Icon selected
                            </Text>
                        ) : (
                            <Text as="span" variant="bodyMd" tone="subdued">
                                No icon selected
                            </Text>
                        )}
                    </BlockStack>
                </Box>
            </BlockStack>

        </BlockStack>
    );
};

export default NumberSettings;