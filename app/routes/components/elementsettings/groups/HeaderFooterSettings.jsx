
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
import ColorPickerField from "../../RichTextEditor/ColorPickerField.jsx";

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
                {/* HEADING COLOR */}

                <ColorPickerField
                    label="Heading color"
                    value={element.headingColor || ""}
                    onChange={(value) =>
                        update("headingColor", value)
                    }
                    helpText="Choose a color for your form heading."
                />

                {/* HEADING FONT SIZE */}

                <TextField
                    label="Font size"
                    type="number"
                   value={String(element.headingFontSize ?? "")}
                    onChange={(value) => {
                        update("headingFontSize", value);
                    }}
                    suffix="px"
                    autoComplete="off"
                    placeholder="24"
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

            {/* FOOTER DESCRIPTION */}

            <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                    Footer description
                </Text>

                <RichTextEditor
                    value={element.content || ""}
                    onChange={(value) =>
                        update("content", value)
                    }
                />
            </BlockStack>

            <Divider />

            {/* MOVE DESCRIPTION TO BOTTOM */}

            <Checkbox
                label="Show description at bottom"
                checked={Boolean(element.showDescriptionAtBottom)}
                onChange={(value) =>
                    update("showDescriptionAtBottom", value)
                }
            />

            <Divider />

            {/* PREVIOUS BUTTON TEXT */}

            <TextField
                label="Previous button text"
                value={element.previousText || ""}
                onChange={(value) =>
                    update("previousText", value)
                }
                autoComplete="off"
                placeholder="Previous"
            />

            {/* NEXT BUTTON TEXT */}

            <TextField
                label="Next button text"
                value={element.nextText || ""}
                onChange={(value) =>
                    update("nextText", value)
                }
                autoComplete="off"
                placeholder="Next"
            />

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

            {/* FULL WIDTH FOOTER BUTTON */}

            <Checkbox
                label="Full width footer button"
                checked={element.fullWidthButton ?? true}
                onChange={(value) =>
                    update("fullWidthButton", value)
                }
            />

            {/* BUTTON ALIGNMENT */}

            {!element.fullWidthButton && (
                <BlockStack gap="200">
                    <Text variant="bodyMd">
                        Footer button alignment
                    </Text>

                    <div className="column-width-selector">
                        {[
                            { label: "Left", value: "left" },
                            { label: "Center", value: "center" },
                            { label: "Right", value: "right" },
                        ].map((alignment) => (
                            <button
                                key={alignment.value}
                                type="button"
                                className={`column-width-selector__option ${(element.buttonAlignment || "left") === alignment.value
                                    ? "is-selected"
                                    : ""
                                    }`}
                                onClick={() =>
                                    update("buttonAlignment", alignment.value)
                                }
                            >
                                {alignment.label}
                            </button>
                        ))}
                    </div>
                </BlockStack>
            )}

            <Divider />

            {/* SUBMIT BUTTON BACKGROUND COLOR */}

            <BlockStack gap="200">
                <Text variant="bodyMd">
                    Submit button background color
                </Text>

                <div className="footer-color-setting">
                    <input
                        type="color"
                        value={element.buttonBackgroundColor || "#ff0b0b"}
                        onChange={(event) =>
                            update("buttonBackgroundColor", event.target.value)
                        }
                    />

                    <TextField
                        label="Background color"
                        labelHidden
                        value={element.buttonBackgroundColor || "#ff0b0b"}
                        onChange={(value) =>
                            update("buttonBackgroundColor", value)
                        }
                        autoComplete="off"
                    />
                </div>
            </BlockStack>

            {/* SUBMIT BUTTON TEXT COLOR */}

            <BlockStack gap="200">
                <Text variant="bodyMd">
                    Submit button text color
                </Text>

                <div className="footer-color-setting">
                    <input
                        type="color"
                        value={element.buttonTextColor || "#ffffff"}
                        onChange={(event) =>
                            update("buttonTextColor", event.target.value)
                        }
                    />

                    <TextField
                        label="Text color"
                        labelHidden
                        value={element.buttonTextColor || "#ffffff"}
                        onChange={(value) =>
                            update("buttonTextColor", value)
                        }
                        autoComplete="off"
                    />
                </div>
            </BlockStack>

        </BlockStack>
    );
}
