
import React from "react";

import {
    BlockStack,
    Text,
    TextField,
    Checkbox,
    Select,
    Divider,
} from "@shopify/polaris";

import RichTextEditor from "../../RichTextEditor/RichTextEditor.jsx";

/* =========================================
   HEADER AND FOOTER SETTINGS
   One component handles both element types.
========================================= */

export default function HeaderFooterSettings({ element, onChange }) {

    // Update only the selected property.
    // All other properties remain unchanged.
    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    // Normalize the element type.
    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isHeader = type === "form_header";
    const isFooter = type === "form_footer";

    // Return nothing for unrelated element types.
    if (!isHeader && !isFooter) {
        return null;
    }

    /* =========================================
       HEADER SETTINGS
    ========================================= */

    if (isHeader) {
        return (
            <BlockStack gap="400">

                {/* SHOW HEADER */}

                <Checkbox
                    label="Show Header"
                    checked={element.showHeader !== false}
                    onChange={(value) =>
                        update("showHeader", value)
                    }
                />

                {/* TITLE */}

                <TextField
                    label="Title"
                    value={element.title || ""}
                    onChange={(value) =>
                        update("title", value)
                    }
                    autoComplete="off"
                    placeholder="Contact us"
                />

                {/* HEADING TAG */}

                <Select
                    label="Heading tag"
                    options={[
                        { label: "Heading 1 (H1)", value: "h1" },
                        { label: "Heading 2 (H2)", value: "h2" },
                        { label: "Heading 3 (H3)", value: "h3" },
                        { label: "Heading 4 (H4)", value: "h4" },
                        { label: "Heading 5 (H5)", value: "h5" },
                        { label: "Heading 6 (H6)", value: "h6" },
                    ]}
                    value={element.headingTag || "h2"}
                    onChange={(value) =>
                        update("headingTag", value)
                    }
                />

                {/* ALIGNMENT */}

                <Select
                    label="Alignment"
                    options={[
                        { label: "Left", value: "left" },
                        { label: "Center", value: "center" },
                        { label: "Right", value: "right" },
                    ]}
                    value={element.alignment || "left"}
                    onChange={(value) =>
                        update("alignment", value)
                    }
                />

                {/* HEADER DESCRIPTION / RICH TEXT */}

                <BlockStack gap="200">
                    <Text variant="bodyMd" as="p">
                        Text editor
                    </Text>

                    <RichTextEditor
                        value={element.description || ""}
                        onChange={(value) =>
                            update("description", value)
                        }
                    />
                </BlockStack>

            </BlockStack>
        );
    }

    /* =========================================
       FOOTER SETTINGS
    ========================================= */

    return (
        <BlockStack gap="400">

         
            {/* FOOTER TEXT */}

            <TextField
                label="Text"
                value={element.text || ""}
                onChange={(value) =>
                    update("text", value)
                }
                autoComplete="off"
                multiline={2}
                placeholder="Footer text"
            />

            {/* FOOTER RICH TEXT AREA */}

            <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                    Rich text area
                </Text>

                <RichTextEditor
                    value={element.content || ""}
                    onChange={(value) =>
                        update("content", value)
                    }
                />
            </BlockStack>

            <Divider />

            {/* DESCRIPTION AT BOTTOM */}

            <Checkbox
                label="Show description at bottom"
                checked={Boolean(element.showDescriptionAtBottom)}
                onChange={(value) =>
                    update("showDescriptionAtBottom", value)
                }
            />

            {element.showDescriptionAtBottom && (
                <TextField
                    label="Bottom description"
                    value={element.bottomDescription || ""}
                    onChange={(value) =>
                        update("bottomDescription", value)
                    }
                    autoComplete="off"
                    multiline={2}
                />
            )}

            <Divider />

            {/* PREVIOUS BUTTON */}

            <Checkbox
                label="Show Previous button"
                checked={Boolean(element.showPreviousButton)}
                onChange={(value) =>
                    update("showPreviousButton", value)
                }
            />

            {element.showPreviousButton && (
                <TextField
                    label="Previous button text"
                    value={element.previousText || "Previous"}
                    onChange={(value) =>
                        update("previousText", value)
                    }
                    autoComplete="off"
                />
            )}

            {/* NEXT BUTTON */}

            <Checkbox
                label="Show Next button"
                checked={Boolean(element.showNextButton)}
                onChange={(value) =>
                    update("showNextButton", value)
                }
            />

            {element.showNextButton && (
                <TextField
                    label="Next button text"
                    value={element.nextText || "Next"}
                    onChange={(value) =>
                        update("nextText", value)
                    }
                    autoComplete="off"
                />
            )}

            <Divider />

            {/* SUBMIT BUTTON TEXT */}

            <TextField
                label="Submit button text"
                value={element.submitText || ""}
                onChange={(value) =>
                    update("submitText", value)
                }
                autoComplete="off"
                placeholder="Submit"
            />

            {/* RESET BUTTON */}

            <Checkbox
                label="Show Reset button"
                checked={Boolean(element.showResetButton)}
                onChange={(value) =>
                    update("showResetButton", value)
                }
            />

            {element.showResetButton && (
                <TextField
                    label="Reset button text"
                    value={element.resetButtonText || "Reset"}
                    onChange={(value) =>
                        update("resetButtonText", value)
                    }
                    autoComplete="off"
                />
            )}

            <Divider />

            {/* FULL WIDTH BUTTON */}

            <Checkbox
                label="Full width footer button"
                checked={Boolean(element.fullWidthButton)}
                onChange={(value) =>
                    update("fullWidthButton", value)
                }
            />

        </BlockStack>
    );
}
