
import React, { useState } from "react";
import { normalizeFormPages } from "../utils/normalizeFormPages.js";
import ElementSettings from "../routes/components/ElementSettings.jsx";
import {
  BlockStack,
  Box,
  Button,
  Divider,
  Text,
  Icon,
  Tooltip,
} from "@shopify/polaris";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
} from "@dnd-kit/sortable";

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
import { templates } from "../utils/templates.js";

export default function FormEditor() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const templateTitle = searchParams.get("title") || "Form editor";
  //const previewUrl = searchParams.get("previewUrl") || "";

  const [selectedOption, setSelectedOption] = useState("Elements");
  const [collpase, setCollapse] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);

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

  // get the selected template 
  const selectedTemplate = templates.find(
    (template) => String(template.id) === templateId
  );
  const defaultPages =
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
    //
    // Default submit button for this page
    submitButton: {
      label: "Submit",
      enabled: true,
    },
  }
    ;
  const [pages, setPages] = useState(() =>
    //it will normalize the one that alrady exist
    normalizeFormPages(
      selectedTemplate?.pages ?? [defaultPages]
    )
  );

  // function to handles the drag and drop 
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event, pageId, rowId) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setPages((previousPages) =>
      previousPages.map((page) => {
        if (page.id !== pageId) return page;

        return {
          ...page,
          rows: page.rows.map((row) => {
            if (row.id !== rowId) return row;

            const oldIndex = row.fields.findIndex(
              (_, index) => `${rowId}-${index}` === active.id
            );

            const newIndex = row.fields.findIndex(
              (_, index) => `${rowId}-${index}` === over.id
            );

            if (oldIndex === -1 || newIndex === -1) {
              return row;
            }

            return {
              ...row,
              fields: arrayMove(row.fields, oldIndex, newIndex),
            };
          }),
        };
      })
    );
  };

  // function to select pass eleemnt info to updateSettings 
  const updateSelectedElement = (updatedElement) => {
    setPages((previousPages) =>
      previousPages.map((page) => ({
        ...page,

        rows: (page.rows || []).map((row) => ({
          ...row,

          fields: (row.fields || []).map((field) =>
            field?.id === updatedElement.id
              ? updatedElement
              : field
          ),

          elements: (row.elements || []).map((element) =>
            element.id === updatedElement.id
              ? updatedElement
              : element
          ),
        })),

        rootElements: (page.rootElements || []).map((element) =>
          element.id === updatedElement.id
            ? updatedElement
            : element
        ),
      }))
    );

    setSelectedElement(updatedElement);
  };

  // three function to make changes when toolbar open on click button 

  const updateElementInPages = (pages, elementId, updater) =>
    pages.map((page) => ({
      ...page,
      rows: (page.rows ?? []).map((row) => ({
        ...row,
        fields: (row.fields ?? []).map((item) =>
          item?.id === elementId ? updater(item) : item
        ),
        elements: (row.elements ?? []).map((item) =>
          item?.id === elementId ? updater(item) : item
        ),
      })),
      rootElements: (page.rootElements ?? []).map((item) =>
        item?.id === elementId ? updater(item) : item
      ),
    }));

  // show or hide
  const handleToggleElementVisibility = (element) => {
    const updatedElement = {
      ...element,
      visible: element.visible === false,
    };

    setPages((previousPages) =>
      updateElementInPages(
        previousPages,
        element.id,
        () => updatedElement
      )
    );

    setSelectedElement(updatedElement);
  };

  // remove the elemnts
  const handleDeleteElement = (element) => {
    const removeElement = (items) =>
      items.filter((item) => item?.id !== element.id);

    setPages((previousPages) =>
      previousPages.map((page) => ({
        ...page,
        rows: (page.rows ?? []).map((row) => ({
          ...row,
          fields: removeElement(row.fields ?? []),
          elements: removeElement(row.elements ?? []),
        })),
        rootElements: removeElement(page.rootElements ?? []),
      }))
    );

    setSelectedElement(null);
  };
  //handle the duplicates crete duplicates
 const handleDuplicateElement = (element) => {
  const duplicate = {
    ...element,
    id: crypto.randomUUID(),
    label: `${element.label || "Field"}`,
    options: (element.options ?? []).map((option) =>
      typeof option === "object"
        ? { ...option, id: crypto.randomUUID() }
        : option
    ),
  };

  setPages((previousPages) =>
    previousPages.map((page) => ({
      ...page,
      rows: (page.rows ?? []).map((row) => {
        const insertAfter = (items) => {
          const index = items.findIndex(
            (item) => item?.id === element.id
          );

          if (index === -1) return items;

          return [
            ...items.slice(0, index + 1),
            duplicate,
            ...items.slice(index + 1),
          ];
        };

        return {
          ...row,
          fields: insertAfter(row.fields ?? []),
          elements: insertAfter(row.elements ?? []),
        };
      }),
      rootElements: (() => {
        const items = page.rootElements ?? [];
        const index = items.findIndex(
          (item) => item?.id === element.id
        );

        if (index === -1) return items;

        return [
          ...items.slice(0, index + 1),
          duplicate,
          ...items.slice(index + 1),
        ];
      })(),
    }))
  );

  setSelectedElement(duplicate);
};

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
  <div className="template-editor__settings-inner">
    <Box paddingBlockStart="400" height="100%">
            {selectedElement ? (
              <ElementSettings
                element={selectedElement}
                onChange={updateSelectedElement}
                onClose={() => setSelectedElement(null)}
              />
            ) : (
              <>
                {selectedOption === "Elements" && (
                  <ElementsPanel
                    pages={pages}
                    setPages={setPages}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
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
              </>
            )}
          </Box>
        </div>
        </div>

        {/* Live preview */}
        <div className="template-editor__preview">
          <LivePreview pages={pages} templateTitle={templateTitle} sensors={sensors} formSettings={selectedTemplate} selectedElementId={selectedElement?.id}
            onSelectElement={setSelectedElement}
            handleDragEnd={handleDragEnd}
            onDuplicateElement={handleDuplicateElement}
            onToggleElementVisibility={handleToggleElementVisibility}
            onDeleteElement={handleDeleteElement} />
        </div>

      </div>
    </div>
  );
}
