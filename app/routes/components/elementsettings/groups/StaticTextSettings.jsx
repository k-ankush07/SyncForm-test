import React from "react";
import RichTextEditor from "../../RichTextEditor/RichTextEditor"
import {
    BlockStack,
    TextField,
    Select,
    Checkbox,
} from "@shopify/polaris";
import ColorPickerField from "../../RichTextEditor/ColorPickerField";
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
                    <TextField
                        label="Heading text"
                        value={element.content || ""}
                        onChange={(value) => update("content", value)}
                        autoComplete="off"
                    />

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
                <RichTextEditor
                    value={element.content || ""}
                    onChange={(value) => update("content", value)}
                />
            )}

            {/* DIVIDER SETTINGS */}
            {isDivider && (
                <BlockStack gap="300">

                    <ColorPickerField
                        label="Divider color"
                        value={element.dividerColor || ""}
                        onChange={(value) => update("dividerColor", value)}
                        helpText="If no color is set, the default is the text color."
                    />

                    <Checkbox
                        label="Hide divider"
                        checked={element.hideDivider || false}
                        onChange={(value) => update("hideDivider", value)}
                    />

                </BlockStack>
            )}

        </BlockStack>
    );
}