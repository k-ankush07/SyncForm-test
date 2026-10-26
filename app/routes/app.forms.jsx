
import React, { useState } from "react";
import {
    Page,
    Button,
    Modal,
    Text,
    BlockStack,
    Box,
    Badge,
    InlineStack,
    Image,
} from "@shopify/polaris";

export default function FormsPage() {
    // Controls whether the popup is visible
    const [active, setActive] = useState(false);

    // Open the popup
    const handleOpen = () => {
        setActive(true);
    };

    // Close the popup
    const handleClose = () => {
        setActive(false);
    };

    return (
        <Page title="Your Forms">
            {/* Button that opens the popup */}
            <Button variant="primary" onClick={handleOpen}>
                Create new form
            </Button>

            {/* Popup modal */}
            <Modal
                open={active}
                onClose={handleClose}
                title="Create new form"
                size="large"
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        <Text as="p" variant="bodyMd">
                            How do you want to create your form?
                        </Text>

                        {/* Option 1 */}
                        <Box
                            borderColor="border"
                            borderWidth="025"
                            borderRadius="300"
                            padding="400"
                        >
                            <InlineStack align="space-between">
                                <BlockStack gap="200">
                                    <Text as="h3" variant="headingSm">
                                        AI-powered form builder{" "}
                                        <Badge tone="info">Beta</Badge>
                                    </Text>

                                    <Text as="p" tone="subdued">
                                        Create a form with AI assistance.
                                    </Text>
                                </BlockStack>

                                <Image
                                    source="sync-form-test/public/images/ai-agent.6144c7639612f84b3865.svg"
                                    alt="AI-powered form builder"
                                    width={90}
                                />
                            </InlineStack>
                        </Box>

                        {/* Option 2 */}
                        <Box
                            borderColor="border"
                            borderWidth="025"
                            borderRadius="300"
                            padding="400"
                        >
                            <InlineStack align="space-between">
                                <BlockStack gap="200">
                                    <Text as="h3" variant="headingSm">
                                        Browse pre-built forms
                                    </Text>

                                    <Text as="p" tone="subdued">
                                        Choose from a variety of pre-built forms to get started.
                                    </Text>
                                </BlockStack>
                                <Image
                                    source="sync-form-test/public/images/templatesform.d12ce8b2dadc1d212cf5.svg"
                                    alt="Pre bulit form builder"
                                    width={90}
                                />
                            </InlineStack>
                        </Box>
                    </BlockStack>
                </Modal.Section>
            </Modal>
        </Page>
    );
}
