
import React, { useState } from "react";

import {
    BlockStack,
    Box,
    Text,
    TextField,
    Divider,
    InlineStack,
    Button,
    ButtonGroup,
    Icon,
} from "@shopify/polaris";

import * as PolarisIcons from "@shopify/polaris-icons";

import SelectIcon from "../../SelectIcon";

// Import the same settings CSS used by PageSettings.
import "./RowSettings.css";

// =====================================================================
// ROW SETTINGS
//
// FLOW:
//   RowSettings
//      |- SelectIcon screen
//      |- Fixed header
//      |- Scrollable settings
//           |- Row label
//           |- Row description
//           |- Select icon
//           |- Conditional display
//
// Every change updates the selected row through onChange.
// =====================================================================

export default function RowSettings({
    row,
    page,
    onChange,
    onClose,
    onDelete,
}) {
    // Controls which settings screen is visible.
    const [activeSection, setActiveSection] = useState("main");

    if (!row) return null;

    // ================================================================
    // UPDATE ROW
    // ================================================================

    // Send partial updates to FormEditor's updateSelectedRow function.
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
                    value={row.icon || ""}
                    onChange={(value) => update("icon", value)}
                    onBack={() => setActiveSection("main")}
                />
            </div>
        );
    }

    // Resolve the saved Polaris icon name into its icon component.
    const SelectedIcon = row.icon
        ? PolarisIcons[row.icon]
        : null;

    // ================================================================
    // MAIN ROW SETTINGS
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
                            {row.label || "Row Settings"}
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

                    {/* ROW LABEL */}

                    <TextField
                        label="Label"
                        value={row.label ?? "Row"}
                        onChange={(value) => update("label", value)}
                        autoComplete="off"
                    />

                    {/* ROW DESCRIPTION */}

                    <TextField
                        label="Description"
                        value={row.description || ""}
                        onChange={(value) => update("description", value)}
                        multiline={3}
                        autoComplete="off"
                    />

                    {/* ROW ICON */}

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
                            Control when this row is displayed
                            based on visitor responses.
                        </Text>
                    </BlockStack>

                </BlockStack>
            </div>

            {/* =====================================================
    FIXED BOTTOM REMOVE ROW BUTTON
===================================================== */}

            <div className="element-settings__footer">
                <Button
                    variant="plain"
                    tone="critical"
                    icon={PolarisIcons.DeleteIcon}
                    onClick={onDelete}
                    className="remove-element-btn"
                    accessibilityLabel="Remove row"
                >
                    Remove row
                </Button>
            </div>

        </div>
    );
}
