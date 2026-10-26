import { Badge, Box, Button, InlineStack, Page, Text } from '@shopify/polaris'
import React from 'react'

function Forms() {
    return (
        <Page>
            <InlineStack>
                <Box>
                    <InlineStack>
                        <Text as='heading' variant='headingMd'>Forms</Text>
                        <Badge tone='subdued'>4 total</Badge>
                    </InlineStack>
                </Box>

                <Box>
                    <InlineStack>
                        <Button variant="primary" onClick={() => {
                            console.log("Create form clicked");
                        }}>
                            + Create form
                        </Button>
                    </InlineStack>
                </Box>
            </InlineStack>
        </Page>
    )
}

export default Forms