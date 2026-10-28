
import React from "react";

import {
    Text,
    Badge,
    Button,
    ButtonGroup,
    InlineStack,
    Box,
    Divider,
    BlockStack,
    Page,
} from "@shopify/polaris";

import PreviewField from "./PreviewField";

export default function LivePreview({
    pages = [],
    templateTitle = "Untitled form",
}) {
    return (
        <div className="live-preview">
            {/* Toolbar */}
            <Box background="bg-surface" padding="300">
                <InlineStack
                    align="space-between"
                    blockAlign="center"
                    gap="400"
                >
                    <InlineStack blockAlign="center" gap="200">
                        <Text variant="bodyMd" fontWeight="semibold">
                            {templateTitle}
                        </Text>

                        <Badge>Draft</Badge>
                    </InlineStack>

                    <InlineStack blockAlign="center" gap="200">
                        <ButtonGroup>
                            <Button>Mobile</Button>
                            <Button variant="primary">Desktop</Button>
                        </ButtonGroup>

                        <Button>English</Button>
                        <Button disabled>Undo</Button>
                        <Button disabled>Redo</Button>
                    </InlineStack>
                </InlineStack>
            </Box>

            <Divider />

            {/* Preview body */}
            <Page>
                <Box paddingBlockEnd="800">
                    <BlockStack gap="200">
                        <Text
                            as="h2"
                            variant="headingLg"
                            alignment="center"
                            fontWeight="semibold"
                        >
                            Contact us
                        </Text>

                        <Text
                            as="p"
                            variant="bodyMd"
                            tone="subdued"
                            alignment="center"
                        >
                            Leave your message and we'll get back to you shortly.
                        </Text>
                    </BlockStack>
                </Box>

                <div className="live-preview__content">
                    {pages
                        .filter((page) => page.open)
                        .map((page) => (
                            <div key={page.id} className="preview-page">
                                <BlockStack gap="400">
                                    {page.label && (
                                        <Text
                                            as="h3"
                                            variant="headingMd"
                                        >
                                            {page.label}
                                        </Text>
                                    )}

                                    {/* Rows */}
                                    {(page.rows ?? []).map((row) => (
                                        <div
                                            key={row.id}
                                            className="preview-row"
                                        >
                                            <div className="preview-row-grid">
                                                {(row.fields ?? []).map(
                                                    (field, index) => (
                                                        <div
                                                            key={
                                                                typeof field === "object"
                                                                    ? field.id ?? index
                                                                    : `${field}-${index}`
                                                            }
                                                        >
                                                            <PreviewField
                                                                field={field}
                                                            />
                                                        </div>
                                                    )
                                                )}

                                                {(row.elements ?? []).map(
                                                    (element, index) => (
                                                        <div
                                                            key={
                                                                element.id ??
                                                                `element-${index}`
                                                            }
                                                        >
                                                            <PreviewField
                                                                element={element}
                                                            />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Root-level elements */}
                                    <BlockStack gap="300">
                                        {(page.rootElements ?? []).map(
                                            (element, index) => (
                                                <div
                                                    key={
                                                        element.id ??
                                                        `root-${index}`
                                                    }
                                                >
                                                    <PreviewField
                                                        element={element}
                                                    />
                                                </div>
                                            )
                                        )}
                                    </BlockStack>
                                    {/* //Button */}
                                    {page.submitButton?.enabled && (
                                        <Box paddingBlockStart="400">
                                            <Button variant="primary" fullWidth submit>
                                                {page.submitButton.label}
                                            </Button>
                                        </Box>
                                    )}
                                </BlockStack>
                            </div>
                        ))}
                </div>
            </Page>
        </div>
    );
}
