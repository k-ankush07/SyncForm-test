import { BlockStack, Page, Tabs } from '@shopify/polaris'
import React, { useState } from 'react'

function Formtemplate() {
    const [selectedCategory, setSelectedCategory] = useState(0);
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
    return (
        <Page title='forms templates'>
            <BlockStack>
                <Tabs tabs={tabs}
                selected={selectedCategory}
                onSelect={(selectedTabIndex) =>
                    setSelectedCategory(selectedTabIndex)
                    } />
            </BlockStack>
        </Page>
    )
}

export default Formtemplate