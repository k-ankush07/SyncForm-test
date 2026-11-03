
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

const FileUploadSettings = ({
    element,
    onChange,
    onOpenIconPicker,
}) => {

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
                placeholder="Choose a file"
                autoComplete="off"
            />

            {/* Limit Characters */}
            <BlockStack gap="200">

                <Checkbox
                    label="Limit characters"
                    checked={Boolean(element.limitCharacters)}
                    onChange={(checked) =>
                        update("limitCharacters", checked)
                    }
                />

                {element.limitCharacters && (
                    <BlockStack gap="300">

                        {/* Minimum Characters */}
                        <TextField
                            label="Min characters"
                            type="number"
                            value={String(element.minCharacters ?? "")}
                            onChange={(value) =>
                                update("minCharacters", value)
                            }
                            placeholder="Enter minimum characters"
                            autoComplete="off"
                        />

                        {/* Maximum Characters */}
                        <TextField
                            label="Max characters"
                            type="number"
                            value={String(element.maxCharacters ?? "")}
                            onChange={(value) =>
                                update("maxCharacters", value)
                            }
                            placeholder="Enter maximum characters"
                            autoComplete="off"
                            helpText="If you don't want to set a maximum number of characters, leave this field blank instead of setting it to 0."
                        />

                    </BlockStack>
                )}
            </BlockStack>

            <Divider />

           </BlockStack>
    );
};

export default FileUploadSettings;
