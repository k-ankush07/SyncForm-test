import { BlockStack, Box, Button, Card, Divider, Grid, InlineStack, Page, Tabs, Text, Icon, Tooltip } from '@shopify/polaris'

import React, { useState } from 'react'
import { Modal, TitleBar } from "@shopify/app-bridge-react";

import {
  FormsIcon,
  PaintBrushFlatIcon,
  CheckCircleIcon,
  EmailIcon,
  AppsIcon,
  SettingsIcon,
  MagicIcon,
  ChevronLeftIcon, ChevronRightIcon, ViewIcon,
  LanguageTranslateIcon,
  MenuIcon,
  AlertTriangleIcon,
  ArrowLeftIcon
} from "@shopify/polaris-icons";
import { useNavigate } from 'react-router';
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
      fields: [
        { id: "firstName", label: "First Name", type: "text" },
        { id: "lastName", label: "Last Name", type: "text" },
        { id: "email", label: "Email", type: "email" },
        { id: "phone", label: "Phone", type: "tel" },
        { id: "message", label: "Message", type: "textarea" },
      ],
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
      id: "register",
      content: "Register",
    },
    {
      id: "popup",
      content: "Popup",
    }
  ];
  // sidebar options
  // const [selectedOption, setSelectedOption] = useState("Elements");
  // // collpase
  // const [collpase, setCollapse] = useState(false)

  // const sidebarOptions = [
  //   { label: "Elements", icon: FormsIcon },
  //   { label: "Edit with AI", icon: MagicIcon, },
  //   { label: "Appearance", icon: PaintBrushFlatIcon },
  //   { label: "After submit", icon: CheckCircleIcon },
  //   { label: "Mail", icon: EmailIcon },
  //   { label: "Integration", icon: AppsIcon },
  //   { label: "Settings", icon: SettingsIcon },
  //   { label: "Translation", icon: LanguageTranslateIcon },
  // ];
  // function to filter the categoroies
  const filteredTemplates =
    selectedCategory === 0
      ? templates
      : templates.filter(
        (template) =>
          template.category === tabs[selectedCategory].id
      );
  // use to show the full width modal 
  const [activeTemplate, setActiveTemplate] = useState(null);
  const navigate = useNavigate();
  return (
    <>
      <Page>
        <Box paddingBlockEnd={400}>
          <InlineStack gap="200" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              variant="plain"
              onClick={() => navigate("/app/forms")}
              accessibilityLabel="Go back to Forms"
            />

            <Text as="h1" variant="headingLg">
              Forms Templates
            </Text>
          </InlineStack>
        </Box>
        <BlockStack>
          {/* //tabs */}
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
                          <Button fullWidth onClick={() => setActiveTemplate(filterproduct)}>Select</Button>
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
      {/* //modal */}
      {activeTemplate && (
        <Modal
          id="form-template-editor"
          variant="max"
          open={true}
          //use the extrnal url /app/form-editor?templateId
          src={`/app/form-editor?templateId=${activeTemplate.id}&title=${encodeURIComponent(activeTemplate.title)}`}
          onHide={() => setActiveTemplate(null)}
        >
          <TitleBar title="Unsaved changes">
            <button
              onClick={() => {
                setActiveTemplate(null);
                setSelectedOption("Elements");
                setCollapse(false);
              }}
            >
              Discard
            </button>

            <button
              variant="primary"
              onClick={() => {
                // Add your save logic here
                setActiveTemplate(null);
              }}
            >
              Save
            </button>
          </TitleBar>
        </Modal>
      )}

    </>
  )
}

export default Formtemplate