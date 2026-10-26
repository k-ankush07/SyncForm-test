import { BlockStack, Box, Button, Card, Divider, Grid, InlineStack, Modal, Page, Tabs, Text, Icon } from '@shopify/polaris'
import React, { useState } from 'react'

import {
  FormsIcon,
  PaintBrushFlatIcon,
  CheckCircleIcon,
  EmailIcon,
  AppsIcon,
  SettingsIcon,

  ChevronLeftIcon, ChevronRightIcon, ViewIcon,
  LanguageTranslateIcon,
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
  const [selectedOption, setSelectedOption] = useState("Elements");

  const sidebarOptions = [
    { label: "Elements", icon: FormsIcon },
    { label: "Appearance", icon: PaintBrushFlatIcon },
    { label: "After submit", icon: CheckCircleIcon },
    { label: "Mail", icon: EmailIcon },
    { label: "Integration", icon: AppsIcon },
    { label: "Settings", icon: SettingsIcon },
    { label: "Translation", icon: LanguageTranslateIcon },
  ];
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
    <Page>
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

      <Modal
        open={activeTemplate !== null}
        onClose={() => setActiveTemplate(null)}
        title={"Unsaved changes"}
        size="large"
        
      >
        {activeTemplate && (
          <Modal.Section>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px minmax(200px, 260px) minmax(0, 1fr)",
                minHeight: "70vh",
                margin: "-16px",
                overflow: "hidden",
              }}
            >
              {/* Sidebar */}
              <div
                style={{
                  borderRight: "1px solid #e1e3e5",
                  padding: "12px 8px",
                  background: "#fff",
                  overflowY: "auto",
                }}
              >
                <BlockStack gap="100">
                  {sidebarOptions.map((option) => {
                    const selected = selectedOption === option.label;

                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSelectedOption(option.label)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "10px",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          textAlign: "left",
                          background: selected ? "#f1f1f1" : "transparent",
                          fontWeight: selected ? "600" : "400",
                        }}
                      >
                        <Icon source={option.icon} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </BlockStack>
              </div>

              {/* Settings panel */}
              <div
                style={{
                  borderRight: "1px solid #e1e3e5",
                  padding: "20px",
                  background: "#fff",
                  minWidth: 0,
                  overflowY: "auto",
                }}
              >
                <Text as="h2" variant="headingMd">
                  {selectedOption}
                </Text>

                <Box paddingBlockStart="400">
                  {selectedOption === "Elements" && (
                    <Text as="p">Add and arrange your form fields here.</Text>
                  )}
                  {selectedOption === "Appearance" && (
                    <Text as="p">Customize colors, fonts, and form styles here.</Text>
                  )}
                  {selectedOption === "After submit" && (
                    <Text as="p">Configure the message shown after submission.</Text>
                  )}
                  {selectedOption === "Mail" && (
                    <Text as="p">Configure email notifications here.</Text>
                  )}
                  {selectedOption === "Integration" && (
                    <Text as="p">Connect your form with other apps here.</Text>
                  )}
                  {selectedOption === "Settings" && (
                    <Text as="p">Configure general form settings here.</Text>
                  )}
                  {selectedOption === "Translation" && (
                    <Text as="p">Manage form translations here.</Text>
                  )}
                </Box>
              </div>

              {/* Live preview */}
              <div
                style={{
                  padding: "24px",
                  background: "#f6f6f7",
                  minWidth: 0,
                  overflowY: "auto",
                }}
              >
                <Box
                  background="bg-surface"
                  borderColor="border"
                  borderWidth="025"
                  borderRadius="300"
                  padding="600"
                >
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingLg">
                      {activeTemplate.heading || activeTemplate.title}
                    </Text>

                    <Text as="p" tone="subdued">
                      {activeTemplate.description}
                    </Text>

                    {/* Add your live form preview here */}
                  </BlockStack>
                </Box>
              </div>
            </div>
          </Modal.Section>
        )}
      </Modal>

    </Page>
  )
}

export default Formtemplate