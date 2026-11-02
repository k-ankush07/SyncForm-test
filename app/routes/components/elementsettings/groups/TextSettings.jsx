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

            {/* Normal Text settings */}

            {isText && (
                <BlockStack gap="300">

                    <Checkbox
                        label="Limit characters"
                        checked={element.enableCharacterLimit || false}
                        onChange={(value) =>
                            update("enableCharacterLimit", value)
                        }
                    />

                    {element.enableCharacterLimit && (
                        <TextField
                            label="Maximum characters"
                            type="number"
                            value={String(element.maxLength ?? 100)}
                            onChange={(value) =>
                                update("maxLength", value)
                            }
                            autoComplete="off"
                        />
                    )}

                    <Checkbox
                        label="Enter numbers only"
                        checked={element.numbersOnly || false}
                        onChange={(value) =>
                            update("numbersOnly", value)
                        }
                    />

                    <Checkbox
                        label="Name validation"
                        checked={element.nameValidation || false}
                        onChange={(value) =>
                            update("nameValidation", value)
                        }
                    />

                </BlockStack>
            )}

            {/* Textarea settings */}

            {isTextarea && (
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

        </BlockStack>
    );
}