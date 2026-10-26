import { BlockStack, Box, Button, Card, Divider, Grid, InlineStack, Page, Tabs, Text } from '@shopify/polaris'
import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ViewIcon } from "@shopify/polaris-icons";
function Formtemplate() {
    const [selectedCategory, setSelectedCategory] = useState(0);

    // category 
    const templates = [
        {
            id: 1,
            title: "Contact form",
            description: "Basic contact form",
            category: "contact",
            image: "/images/contact.fc71ad9f717b4b182c75.png",
        },
        {
            id: 2,
            title: "Multi step form",
            description: "Form with multiple step",
            category: "contact",
            image: "/images/multi-step.png",
        },
        {
            id: 3,
            title: "Contact form with image",
            description: "Basic contact form with image",
            category: "contact",
            image: "/images/contact-image.png",
        },
        {
            id: 4,
            title: "Popup form",
            description: "Popup newsletter form",
            category: "popup",
            image: "/images/popup.png",
        },
        {
            id: 5,
            title: "Registration form",
            description: "Create an account form",
            category: "register",
            image: "/images/register.png",
        },
    ]
    //tabs
    const tabs = [
        {
            id: "all",
            content: "All",
        },
        {
            id: "contact",
            content: "Contact",
        },
        {
            id: "Register",
            content: "Register",
        },
        {
            id: "popup",
            content: "Popup",
        }
    ];
    // const tabss = templates.map((categories) => ({
    //     id: categories.id,
    //     content: category.content,
    // }))
    const filteredTemplates =
        selectedCategory === 0
            ? templates
            : templates.filter(
                (template) =>
                    template.category === tabs[selectedCategory].id
            );
    return (
        <Page title='forms templates'>
            <BlockStack>
                <Tabs tabs={tabs}
                    selected={selectedCategory}
                    onSelect={(selectedTabIndex) =>
                        setSelectedCategory(selectedTabIndex)
                    } />
            </BlockStack>

            <Grid>
                {filteredTemplates.map((filterproduct) => (
                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }} key={filterproduct.id}>
                        <Card padding="0">
                            <BlockStack gap="0">
                                {/* Form preview image */}
                                <Box padding="300">
                                    <img
                                        src={filterproduct.image}
                                        alt={filterproduct.title}
                                        style={{
                                            width: "100%",
                                            height: "260px",
                                            objectFit: "contain",
                                        }}
                                    />
                                </Box>

                                <Divider />

                                {/* Template information and actions */}
                                <Box padding="300">
                                    <BlockStack gap="200">
                                        <BlockStack gap="100">
                                            <InlineStack gap="200" blockAlign="center">
                                                <Text as="p" variant="bodyMd">
                                                    ♧
                                                </Text>
                                                <Text as="p">{filterproduct.title}</Text>
                                            </InlineStack>

                                            <InlineStack gap="200" blockAlign="center">
                                                <Text as="p" variant="bodyMd">
                                                    ✉
                                                </Text>
                                                <Text as="p">{filterproduct.description}</Text>
                                            </InlineStack>
                                        </BlockStack>

                                        <InlineStack gap="200" blockAlign="center" wrap={false}>
                                            <Button
                                                icon={ChevronLeftIcon}
                                                disabled
                                                accessibilityLabel="Previous preview"
                                            />
                                            <Button
                                                icon={ChevronRightIcon}
                                                disabled
                                                accessibilityLabel="Next preview"
                                            />

                                            <Box width="100%">
                                                <Button fullWidth>Select</Button>
                                            </Box>

                                            <Button
                                                icon={ViewIcon}
                                                accessibilityLabel="Preview template"
                                            />
                                        </InlineStack>
                                    </BlockStack>
                                </Box>
                            </BlockStack>
                        </Card>
                    </Grid.Cell>
                ))}

            </Grid>
        </Page>
    )
}

export default Formtemplate