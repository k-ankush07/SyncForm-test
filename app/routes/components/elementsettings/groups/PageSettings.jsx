
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
import HeaderFooterSettings from "./HeaderFooterSettings";

import "./PageSettings.css";

// =====================================================================
// PAGE SETTINGS
//
// FLOW:
//
//   PageSettings
//      |- SelectIcon screen
//      |- Fixed header
//      |- Scrollable settings
//           |- Page label
//           |- Page description
//           |- Page icon
//           |- Custom header
//           |     |- HeaderFooterSettings
//           |          |- Header title
//           |          |- Heading tag
//           |          |- Heading color
//           |          |- Font size
//           |          |- Alignment
//           |          |- Rich text editor
//           |
//           |- Custom footer
//           |     |- HeaderFooterSettings
//           |          |- Footer rich text editor
//           |          |- Previous button
//           |          |- Next button
//           |          |- Submit button
//           |          |- Reset button
//           |          |- Button colors
//           |
//           |- Conditional display
//
// DATA STRUCTURE:
//
//   page.header
//   page.footer
//   page.useCustomHeader
//   page.useCustomFooter
//
// Every change updates the selected page through onChange.
// =====================================================================

export default function PageSettings({
    page,
    onChange,
    onClose,
}) {

    // ================================================================
    // LOCAL STATE
    // ================================================================

    const [activeSection, setActiveSection] = useState("main");

    if (!page) return null;


    // ================================================================
    // UPDATE PAGE
    // ================================================================

    // Sends partial updates to FormEditor's updateSelectedPage.
    const update = (key, value) => {
        onChange({
            [key]: value,
        });
    };


    // ================================================================
    // CUSTOM HEADER
    // ================================================================

    // Use the independent page header.
    // Never directly modify the shared form header here.

    const customHeader = {
        ...(page.header || {}),
        type: "form_header",
    };

    const updateCustomHeader = (updatedHeader) => {
        update("header", updatedHeader);
    };


    // ================================================================
    // CUSTOM FOOTER
    // ================================================================

    // Use the independent page footer.
    // Never directly modify the shared form footer here.

    const customFooter = {
        ...(page.footer || {}),
        type: "form_footer",
    };

    const updateCustomFooter = (updatedFooter) => {
        update("footer", updatedFooter);
    };


    // ================================================================
    // ICON PICKER SCREEN
    // ================================================================

    if (activeSection === "selectIcon") {

        return (
            <div className="element-settings">

                <SelectIcon
                    value={page.icon || ""}

                    onChange={(value) =>
                        update("icon", value)
                    }

                    onBack={() =>
                        setActiveSection("main")
                    }
                />

            </div>
        );
    }


    // ================================================================
    // RESOLVE SELECTED ICON
    // ================================================================

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


                    {/* =================================================
                        PAGE LABEL
                    ================================================= */}

                    <TextField
                        label="Label"
                        value={page.label || ""}
                        onChange={(value) =>
                            update("label", value)
                        }
                        autoComplete="off"
                        placeholder="Page 1"
                    />


                    {/* =================================================
                        PAGE DESCRIPTION
                    ================================================= */}

                    <TextField
                        label="Description"
                        value={page.description || ""}
                        onChange={(value) =>
                            update("description", value)
                        }
                        multiline={3}
                        autoComplete="off"
                        placeholder="Enter page description"
                    />


                    {/* =================================================
                        PAGE ICON
                    ================================================= */}

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

                                    {/* CHANGE ICON */}

                                    <Button
                                        variant="plain"
                                        icon={PolarisIcons.RefreshIcon}
                                        onClick={() =>
                                            setActiveSection("selectIcon")
                                        }
                                    >
                                        Change
                                    </Button>


                                    {/* REMOVE ICON */}

                                    <Button
                                        variant="plain"
                                        tone="critical"
                                        icon={PolarisIcons.DeleteIcon}
                                        onClick={() =>
                                            update("icon", "")
                                        }
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


                    {/* =================================================
                        CUSTOM HEADER SETTINGS
                    ================================================= */}

                    <BlockStack gap="300">


                        {/* CUSTOM HEADER TOGGLE */}

                        <Checkbox
                            label="Use custom header"
                            checked={Boolean(page.useCustomHeader)}
                            onChange={(value) =>
                                update("useCustomHeader", value)
                            }
                        />


                        {/* SHOW HEADER SETTINGS WHEN ENABLED */}

                        {page.useCustomHeader && (

                            <Box
                            >

                                <BlockStack gap="300">

                                    <Text
                                        variant="headingSm"
                                        as="h3"
                                    >
                                        Custom header settings
                                    </Text>


                                    <Divider />


                                    {/* EXISTING HEADER SETTINGS COMPONENT */}

                                    <HeaderFooterSettings
                                        element={customHeader}
                                        onChange={updateCustomHeader}
                                    />

                                </BlockStack>

                            </Box>

                        )}

                    </BlockStack>


                    <Divider />


                    {/* =================================================
                        CUSTOM FOOTER SETTINGS
                    ================================================= */}

                    <BlockStack gap="300">


                        {/* CUSTOM FOOTER TOGGLE */}

                        <Checkbox
                            label="Use custom footer"
                            checked={Boolean(page.useCustomFooter)}
                            onChange={(value) =>
                                update("useCustomFooter", value)
                            }
                        />


                        {/* SHOW FOOTER SETTINGS WHEN ENABLED */}

                        {page.useCustomFooter && (

                            <Box
                                
                            >

                                <BlockStack gap="300">

                                    <Text
                                        variant="headingSm"
                                        as="h3"
                                    >
                                        Custom footer settings
                                    </Text>
                                    <Divider />


                                    {/* EXISTING FOOTER SETTINGS COMPONENT */}

                                    <HeaderFooterSettings
                                        element={customFooter}
                                        onChange={updateCustomFooter}
                                    />

                                </BlockStack>

                            </Box>

                        )}

                    </BlockStack>


                    <Divider />


                    {/* =================================================
                        CONDITIONAL DISPLAY
                    ================================================= */}

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
