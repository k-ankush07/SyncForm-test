import React from "react";

import {
    BlockStack,
    TextField,
    Select,
} from "@shopify/polaris";

export default function StaticTextSettings({ element, onChange }) {

    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isHeading = type === "heading";
    const isParagraph = type === "paragraph";
    const isDivider = type === "divider";

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    return (
        <BlockStack gap="400">

            {/* HEADING SETTINGS */}
            {isHeading && (
                <BlockStack gap="300">
                    {/* <TextField
                        label="Heading text"
                        value={element.content || ""}
                        onChange={(value) => update("content", value)}
                        autoComplete="off"
                    /> */}

                    <Select
                        label="Heading size"
                        options={[
                            { label: "Heading 1 (H1)", value: "h1" },
                            { label: "Heading 2 (H2)", value: "h2" },
                            { label: "Heading 3 (H3)", value: "h3" },
                            { label: "Heading 4 (H4)", value: "h4" },
                            { label: "Heading 5 (H5)", value: "h5" },
                            { label: "Heading 6 (H6)", value: "h6" },
                        ]}
                        value={element.headingTag || "h2"}
                        onChange={(value) => update("headingTag", value)}
                    />
                </BlockStack>
            )}

            {/* PARAGRAPH SETTINGS */}
            {isParagraph && (
                <TextField
                    label="Paragraph text"
                    value={element.content || ""}
                    onChange={(value) => update("content", value)}
                    multiline={4}
                    autoComplete="off"
                />
            )}

            {/* DIVIDER SETTINGS */}
            {isDivider && (
                <BlockStack gap="300">
                    <Select
                        label="Divider style"
                        options={[
                            { label: "Solid", value: "solid" },
                            { label: "Dashed", value: "dashed" },
                            { label: "Dotted", value: "dotted" },
                        ]}
                        value={element.dividerStyle || "solid"}
                        onChange={(value) => update("dividerStyle", value)}
                    />
                </BlockStack>
            )}

        </BlockStack>
    );
}