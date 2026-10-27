
import React from "react";
import {
    Text,
    Badge,
    Button,
    ButtonGroup,
    InlineStack,
    Box,
    Divider,
} from "@shopify/polaris";

export default function LivePreview({
    pages,
    templateTitle,
}) {
    return (
        <div className="live-preview">

            {/* Toolbar above live preview */}
            <Box background="bg-surface" padding="300">
                <InlineStack align="space-between" blockAlign="center" gap="400">
                    {/* Left side */}
                    <InlineStack blockAlign="center" gap="200">
                        <Text variant="bodyMd" fontWeight="semibold">
                            {templateTitle}
                        </Text>

                        <Badge>Draft</Badge>
                    </InlineStack>

                    {/* Right side */}
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

            {/* Actual preview content */}
            <div className="live-preview__content">
                {pages
                    .filter((page) => page.open)
                    .map((page) => (
                        <div key={page.id}>
                            <h2>{page.label}</h2>

                            {page.rows.map((row) => (
                                <div key={row.id}>
                                    {row.fields.map((field) => (
                                        <p key={field}>{field}</p>
                                    ))}

                                    {row.elements.map((element) => (
                                        <p key={element.id}>{element.label}</p>
                                    ))}
                                </div>
                            ))}

                            {page.rootElements.map((element) => (
                                <p key={element.id}>{element.label}</p>
                            ))}
                        </div>
                    ))}
            </div>

        </div>
    );
}
