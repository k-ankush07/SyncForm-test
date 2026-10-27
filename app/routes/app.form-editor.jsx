
import React, { useState } from "react";

import {
  BlockStack,
  Box,
  Button,
  Divider,
  InlineStack,
  Text,
  Icon,
  Tooltip,
} from "@shopify/polaris";

import {
  FormsIcon,
  PaintBrushFlatIcon,
  CheckCircleIcon,
  EmailIcon,
  AppsIcon,
  SettingsIcon,
  MagicIcon,
  LanguageTranslateIcon,
  MenuIcon,
  AlertTriangleIcon,
} from "@shopify/polaris-icons";
import ElementsPanel from "../routes/components/ElementsPanel";
import LivePreview from '../routes/components/LivePreview'
import { useSearchParams } from "react-router";

export default function FormEditor() {
  const [searchParams] = useSearchParams();

  const templateTitle = searchParams.get("title") || "Form editor";
  //const previewUrl = searchParams.get("previewUrl") || "";

  const [selectedOption, setSelectedOption] = useState("Elements");
  const [collpase, setCollapse] = useState(false);

  const sidebarOptions = [
    { label: "Elements", icon: FormsIcon },
    { label: "Edit with AI", icon: MagicIcon },
    { label: "Appearance", icon: PaintBrushFlatIcon },
    { label: "After submit", icon: CheckCircleIcon },
    { label: "Mail", icon: EmailIcon },
    { label: "Integration", icon: AppsIcon },
    { label: "Settings", icon: SettingsIcon },
    { label: "Translation", icon: LanguageTranslateIcon },
  ];

  // stores pages info 
  // Initially, we create one page:
  // Page 1
  //
  // Page 1 contains:
  // - Row 1: First Name and Last Name
  // - Row 2: Email and Phone
  // - rootElements: elements outside the rows
  //
  // open: true means the page is expanded.
  //
  // Each row has its own "elements" array.
  const [pages, setPages] = useState([
    {
      id: 1,
      label: "Page 1",
      open: true,
      rows: [
        {
          id: 101,
          fields: ["First Name", "Last Name"],
          elements: [],
        },
        {
          id: 102,
          fields: ["Email", "Phone"],
          elements: [],
        },
      ],
      rootElements: [],
    },
  ]);

  return (
    <div className="template-editor">
      {/* Main content */}
      <div
        className={`template-editor__main ${collpase
          ? "template-editor__main--collapsed"
          : "template-editor__main--expanded"
          }`}
      >

        {/* Sidebar */}
        <div
          className={`template-editor__sidebar ${collpase
            ? "template-editor__sidebar--collapsed"
            : ""
            }`}
        >
          <div className="template-editor__sidebar-options">
            <BlockStack gap="100">
              {sidebarOptions.map((option, index) => (
                <React.Fragment key={option.label}>
                  {index === 4 || index === 7 ? (
                    <Box paddingBlock="200">
                      <Divider />
                    </Box>
                  ) : null}

                  <Tooltip
                    content={option.label}
                    disabled={!collpase}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOption(option.label)
                      }
                      className={`template-editor__option ${selectedOption === option.label
                        ? "template-editor__option--selected"
                        : ""
                        } ${collpase
                          ? "template-editor__option--collapsed"
                          : ""
                        }`}
                      aria-label={option.label}
                    >
                      <span className="template-editor__option-icon">
                        <Icon source={option.icon} />
                      </span>

                      {!collpase && (
                        <span>{option.label}</span>
                      )}
                    </button>
                  </Tooltip>
                </React.Fragment>
              ))}
            </BlockStack>
          </div>

          {/* Collapse sidebar */}
          <div className="template-editor__collapse">
            <Divider />

            <Tooltip
              content={
                collpase
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              <Button
                fullWidth
                variant="tertiary"
                icon={MenuIcon}
                onClick={() =>
                  setCollapse((prev) => !prev)
                }
                accessibilityLabel={
                  collpase
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                }
              >
                {collpase ? "" : "Collapse Sidebar"}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Settings panel */}
        <div className="template-editor__settings">
          {/* <Text as="h2" variant="headingMd">
            {selectedOption}
          </Text> */}

          <Box paddingBlockStart="400">
            {selectedOption === "Elements" && (<ElementsPanel
              pages={pages}
              setPages={setPages}
            />
            )}

            {selectedOption === "Edit with AI" && (
              <Text as="p">
                Use AI to help build and customize your form.
              </Text>
            )}

            {selectedOption === "Appearance" && (
              <Text as="p">
                Customize colors, fonts, and form styles here.
              </Text>
            )}

            {selectedOption === "After submit" && (
              <Text as="p">
                Configure the message shown after submission.
              </Text>
            )}

            {selectedOption === "Mail" && (
              <Text as="p">
                Configure email notifications here.
              </Text>
            )}

            {selectedOption === "Integration" && (
              <Text as="p">
                Connect your form with other apps here.
              </Text>
            )}

            {selectedOption === "Settings" && (
              <Text as="p">
                Configure general form settings here.
              </Text>
            )}

            {selectedOption === "Translation" && (
              <Text as="p">
                Manage form translations here.
              </Text>
            )}
          </Box>
        </div>

        {/* Live preview */}
        {/* <div className="template-editor__preview">

          <iframe
            title={`${templateTitle} preview`}
            src={previewUrl}
            className="template-editor__iframe"
          />
        </div> */}
        <div className="template-editor__preview">
          <LivePreview pages={pages} templateTitle={templateTitle} />
        </div>

      </div>
    </div>
  );
}
