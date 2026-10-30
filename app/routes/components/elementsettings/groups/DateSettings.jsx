
import React from "react";

import {
    BlockStack,
    TextField,
    Checkbox,
    InlineStack,
    Button,
    Box,
    Text,
    Divider,
} from "@shopify/polaris";

const DateSettings = ({ element, onChange, onOpenIconPicker }) => {

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
                placeholder="Select date"
                autoComplete="off"
            />

            {/* Default Date */}
            <TextField
                label="Default value"
                type="date"
                value={element.defaultValue || ""}
                onChange={(value) => update("defaultValue", value)}
                autoComplete="off"
            />

            {/* Minimum Date */}
            <BlockStack gap="200">
                <Checkbox
                    label="Set min date"
                    checked={Boolean(element.setMinDate)}
                    onChange={(checked) => update("setMinDate", checked)}
                />

                {element.setMinDate && (
                    <TextField
                        label="Minimum date"
                        labelHidden
                        type="date"
                        value={element.minDate || ""}
                        onChange={(value) => update("minDate", value)}
                        autoComplete="off"
                    />
                )}
            </BlockStack>

            {/* Maximum Date */}
            <BlockStack gap="200">
                <Checkbox
                    label="Set max date"
                    checked={Boolean(element.setMaxDate)}
                    onChange={(checked) => update("setMaxDate", checked)}
                />

                {element.setMaxDate && (
                    <TextField
                        label="Maximum date"
                        labelHidden
                        type="date"
                        value={element.maxDate || ""}
                        onChange={(value) => update("maxDate", value)}
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

export default DateSettings;
