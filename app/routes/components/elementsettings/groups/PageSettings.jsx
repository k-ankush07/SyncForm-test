
import React, { useState } from "react";

import {
    BlockStack,
    Box,
    Text,
    TextField,
    Checkbox,
    Divider,
    InlineStack,
    Button,
    ButtonGroup,
    Icon,
} from "@shopify/polaris";

import * as PolarisIcons from "@shopify/polaris-icons";

import SelectIcon from "../../SelectIcon";

// Import the CSS extracted from your existing settings stylesheet.
import "./PageSettings.css";

// =====================================================================
// PAGE SETTINGS
//
// FLOW:
//   PageSettings
//      |- SelectIcon screen
//      |- Fixed header
//      |- Scrollable settings
//           |- Page label
//           |- Page description
//           |- Page icon
//           |- Custom header
//           |- Custom footer
//           |- Conditional display
//
// Every change updates the selected page through onChange.
// =====================================================================

export default function PageSettings({
    page,
    onChange,
    onClose,
}) {
    // Controls which settings screen is visible.
    const [activeSection, setActiveSection] = useState("main");

    if (!page) return null;

    // ================================================================
    // UPDATE PAGE
    // ================================================================

    // Send partial updates to FormEditor's updateSelectedPage function.
    const update = (key, value) => {
        onChange({
            [key]: value,
        });
    };

    // ================================================================
    // ICON PICKER SCREEN
    // ================================================================

    if (activeSection === "selectIcon") {
        return (
            <div className="element-settings">
                <SelectIcon
                    value={page.icon || ""}
                    onChange={(value) => update("icon", value)}
                    onBack={() => setActiveSection("main")}
                />
            </div>
        );
    }

    // Resolve the saved Polaris icon name into its icon component.
    const SelectedIcon = page.icon
        ? PolarisIcons[page.icon]
        : null;

    // ================================================================
    // MAIN PAGE SETTINGS
    // ================================================================

    return (
        <div className="element-settings">

            {/* =====================================================
                FIXED HEADER
            ===================================================== */}

            <div className="element-settings__header">
                <Box paddingBlock="300">
                    <InlineStack
                        align="start"
                        blockAlign="center"
                        gap="200"
                    >
                        <Button
                            icon={PolarisIcons.ArrowLeftIcon}
                            variant="plain"
                            onClick={onClose}
                            accessibilityLabel="Back to elements"
                        />

                        <Text variant="headingMd" as="h2">
                            {page.label || "Page Settings"}
                        </Text>
                    </InlineStack>
                </Box>

                <Divider />
            </div>

            {/* =====================================================
                SCROLLABLE SETTINGS CONTENT
            ===================================================== */}

            <div className="element-settings__content">
                <BlockStack gap="400">

                    {/* PAGE LABEL */}

                    <TextField
                        label="Label"
                        value={page.label || ""}
                        onChange={(value) => update("label", value)}
                        autoComplete="off"
                    />

                    {/* PAGE DESCRIPTION */}

                    <TextField
                        label="Description"
                        value={page.description || ""}
                        onChange={(value) => update("description", value)}
                        multiline={3}
                        autoComplete="off"
                    />

                    {/* PAGE ICON */}

                    <BlockStack gap="200">
                        <InlineStack
                            align="space-between"
                            blockAlign="center"
                        >
                            <Text as="p" variant="bodyMd">
                                Select icon
                            </Text>

                            {SelectedIcon && (
                                <ButtonGroup gap="tight">
                                    <Button
                                        variant="plain"
                                        icon={PolarisIcons.RefreshIcon}
                                        onClick={() =>
                                            setActiveSection("selectIcon")
                                        }
                                    >
                                        Change
                                    </Button>

                                    <Button
                                        variant="plain"
                                        tone="critical"
                                        icon={PolarisIcons.DeleteIcon}
                                        onClick={() => update("icon", "")}
                                    >
                                        Remove
                                    </Button>
                                </ButtonGroup>
                            )}
                        </InlineStack>

                        <div className="select-icon-wrapper">
                            {SelectedIcon ? (
                                <Icon source={SelectedIcon} />
                            ) : (
                                <Button
                                    onClick={() =>
                                        setActiveSection("selectIcon")
                                    }
                                >
                                    Select icon
                                </Button>
                            )}
                        </div>
                    </BlockStack>

                    <Divider />

                    {/* CUSTOM HEADER */}

                    <Checkbox
                        label="Use custom header"
                        checked={Boolean(page.useCustomHeader)}
                        onChange={(value) =>
                            update("useCustomHeader", value)
                        }
                    />

                    {/* CUSTOM FOOTER */}

                    <Checkbox
                        label="Use custom footer"
                        checked={Boolean(page.useCustomFooter)}
                        onChange={(value) =>
                            update("useCustomFooter", value)
                        }
                    />

                    <Divider />

                    {/* CONDITIONAL DISPLAY */}

                    <BlockStack gap="200">
                        <InlineStack
                            align="space-between"
                            blockAlign="center"
                        >
                            <Text variant="bodyMd">
                                Conditional display
                            </Text>

                            <Text
                                variant="bodySm"
                                tone="subdued"
                            >
                                Premium
                            </Text>
                        </InlineStack>

                        <Text
                            as="p"
                            variant="bodySm"
                            tone="subdued"
                        >
                            Control when this page is displayed
                            based on visitor responses.
                        </Text>
                    </BlockStack>

                </BlockStack>
            </div>

        </div>
    );
}
