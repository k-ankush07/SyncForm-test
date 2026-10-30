
import React from "react";

import {
    BlockStack,
    TextField,
    Checkbox,
    Divider,
    Text,
} from "@shopify/polaris";

export default function TextSettings({ element, onChange }) {

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    const isText = element.type === "text";
    const isTextarea = element.type === "textarea";

    return (
        <BlockStack gap="300">

            {/* <Text variant="headingMd" as="h3">
                Input settings
            </Text> */}

            {/* Shared Text and Textarea settings */}

            <TextField
                label="Placeholder"
                value={element.placeholder || ""}
                onChange={(value) => update("placeholder", value)}
                autoComplete="off"
            />

            <TextField
                label="Default value"
                value={element.defaultValue || ""}
                onChange={(value) => update("defaultValue", value)}
                autoComplete="off"
            />

            <Divider />

            {/* Text-only settings */}

            {isText && (
                <BlockStack gap="300">

                    <Text variant="headingMd" as="h3">
                        Text validation
                    </Text>

                    <Checkbox
                        label="Allow numbers"
                        checked={element.allowNumbers || false}
                        onChange={(value) =>
                            update("allowNumbers", value)
                        }
                    />

                    <Checkbox
                        label="Allow special characters"
                        checked={element.allowSpecialCharacters !== false}
                        onChange={(value) =>
                            update("allowSpecialCharacters", value)
                        }
                    />

                    <Checkbox
                        label="Show icon"
                        checked={element.showIcon || false}
                        onChange={(value) =>
                            update("showIcon", value)
                        }
                    />

                    {element.showIcon && (
                        <TextField
                            label="Icon name"
                            value={element.iconName || ""}
                            onChange={(value) =>
                                update("iconName", value)
                            }
                            autoComplete="off"
                        />
                    )}

                </BlockStack>
            )}

            {/* Textarea-only settings */}

            {isTextarea && (
                <BlockStack gap="300">

                    {/* <Text variant="headingMd" as="h3">
                        Textarea settings
                    </Text> */}

                    <TextField
                        label="Number of rows"
                        type="number"
                        value={String(element.rows ?? 4)}
                        onChange={(value) =>
                            update("rows", value)
                        }
                        autoComplete="off"
                    />

                    <Checkbox
                        label="Enable character limit"
                        checked={element.enableCharacterLimit || false}
                        onChange={(value) =>
                            update("enableCharacterLimit", value)
                        }
                    />

                    {element.enableCharacterLimit && (
                        <TextField
                            label="Maximum characters"
                            type="number"
                            value={String(element.maxLength ?? 500)}
                            onChange={(value) =>
                                update("maxLength", value)
                            }
                            autoComplete="off"
                        />
                    )}

                </BlockStack>
            )}

        </BlockStack>
    );
}
