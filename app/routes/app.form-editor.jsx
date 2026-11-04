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
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { arrayMove } from "@dnd-kit/sortable";

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
} from "@shopify/polaris-icons";

import ElementsPanel from "../routes/components/ElementsPanel";
import LivePreview from "../routes/components/LivePreview";

import { useSearchParams } from "react-router";
import { templates } from "../utils/templates.js";

// =========================================
// HELPER: NORMALIZE ROWS
//
// 1. Remove rows that contain no elements.
// 2. If a row contains only one element,
//    move that element into rootElements.
// 3. Keep rows containing two or more elements.
//
// This keeps ElementsPanel and LivePreview
// synchronized through the shared pages state.
// =========================================

const normalizeRows = (pages) =>
  pages.map((page) => {
    const rootElements = [...(page.rootElements ?? [])];
    const updatedRows = [];

    (page.rows ?? []).forEach((row) => {
      const fields = row.fields ?? [];
      const elements = row.elements ?? [];

      const totalElements = fields.length + elements.length;

      // CASE 1: Remove completely empty rows.
      if (totalElements === 0) {
        return;
      }

      // CASE 2: Convert a single-element row into a root element.
      if (totalElements === 1) {
        const remainingElement = fields[0] ?? elements[0];

        // Prevent accidentally adding the same element twice.
        const alreadyExists = rootElements.some(
          (item) => item.id === remainingElement.id
        );

        if (!alreadyExists) {
          rootElements.push(remainingElement);
        }

        return;
      }

      // CASE 3: Keep rows containing two or more elements.
      updatedRows.push({
        ...row,
        fields,
        elements,
      });
    });

    return {
      ...page,
      rows: updatedRows,
      rootElements,
    };
  });

export default function FormEditor() {
  const [searchParams] = useSearchParams();

  const templateId = searchParams.get("templateId");
  const templateTitle = searchParams.get("title") || "Form editor";

  // Main editor states.
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

  // =========================================
  // TEMPLATE AND DEFAULT PAGE
  // =========================================

  const selectedTemplate = templates.find(
    (template) => String(template.id) === templateId
  );

  // Default page used when no template is selected.
  const defaultPages = {
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

    // Default submit button for this page.
    submitButton: {
      label: "Submit",
      enabled: true,
    },
  };

  // Normalize the selected template pages.
  const [pages, setPages] = useState(() =>
    normalizeFormPages(
      selectedTemplate?.pages ?? [defaultPages]
    )
  );

  // =========================================
  // DRAG AND DROP SENSORS
  // =========================================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // =========================================
  // ELEMENTS PANEL DRAG END
  // Handles page sorting, row sorting and
  // moving sidebar elements.
  // =========================================

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    // Reorder pages.
    if (activeData.type === "page" && overData.type === "page") {
      setPages((previousPages) => {
        const oldIndex = previousPages.findIndex(
          (page) => `page-${page.id}` === active.id
        );

        const newIndex = previousPages.findIndex(
          (page) => `page-${page.id}` === over.id
        );

        if (oldIndex === -1 || newIndex === -1) {
          return previousPages;
        }

        return arrayMove(previousPages, oldIndex, newIndex);
      });

      return;
    }

    // Reorder rows.
    if (activeData.type === "row" && overData.type === "row") {
      if (activeData.pageId !== overData.pageId) return;

      setPages((previousPages) =>
        previousPages.map((page) => {
          if (page.id !== activeData.pageId) return page;

          const currentRows = page.rows ?? [];

          const oldIndex = currentRows.findIndex(
            (row) => row.id === activeData.rowId
          );

          const newIndex = currentRows.findIndex(
            (row) => row.id === overData.rowId
          );

          if (oldIndex === -1 || newIndex === -1) return page;

          return {
            ...page,
            rows: arrayMove(currentRows, oldIndex, newIndex),
          };
        })
      );

      return;
    }

    // Move fields and created elements from the ElementsPanel.
    if (
      ["field", "element", "rootElement"].includes(activeData.type)
    ) {
      moveElementBetweenLocations(activeData, overData);
    }
  };

  // =========================================
  // UPDATE SELECTED ELEMENT
  // Used by ElementSettings.
  // =========================================

  const updateSelectedElement = (updatedElement) => {
    setPages((previousPages) =>
      previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => ({
          ...row,

          fields: (row.fields ?? []).map((field) =>
            field?.id === updatedElement.id
              ? updatedElement
              : field
          ),

          elements: (row.elements ?? []).map((element) =>
            element?.id === updatedElement.id
              ? updatedElement
              : element
          ),
        })),

        rootElements: (page.rootElements ?? []).map((element) =>
          element?.id === updatedElement.id
            ? updatedElement
            : element
        ),
      }))
    );

    setSelectedElement(updatedElement);
  };

  // =========================================
  // UPDATE ELEMENT IN PAGES
  // Shared helper for updating element properties.
  // =========================================

  const updateElementInPages = (currentPages, elementId, updater) =>
    currentPages.map((page) => ({
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

  // =========================================
  // SHOW OR HIDE ELEMENT
  // =========================================

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

  // =========================================
  // DELETE ELEMENT
  //
  // After deleting:
  // - Empty rows are removed.
  // - Rows with one remaining element become root elements.
  // =========================================

  const handleDeleteElement = (element) => {
    const removeElement = (items) =>
      (items ?? []).filter((item) => item?.id !== element.id);

    setPages((previousPages) => {
      const updatedPages = previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => ({
          ...row,
          fields: removeElement(row.fields),
          elements: removeElement(row.elements),
        })),

        rootElements: removeElement(page.rootElements),
      }));

      // Normalize rows after deleting the element.
      return normalizeRows(updatedPages);
    });

    setSelectedElement(null);
  };

  // =========================================
  // DUPLICATE ELEMENT
  // Insert the duplicate immediately after
  // the original element.
  // =========================================

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

  // =========================================
  // PREVIEW DRAG AND DROP
  // This handler is separate from the
  // ElementsPanel drag handler.
  // =========================================

  const handlePreviewDragEnd = ({ active, over }) => {
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (
      !activeData ||
      !overData ||
      activeData.type !== "previewElement"
    ) {
      return;
    }

    setPages((previousPages) => {
      // Clone page data to avoid mutating React state.
      const updatedPages = previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => ({
          ...row,
          fields: [...(row.fields ?? [])],
          elements: [...(row.elements ?? [])],
        })),

        rootElements: [...(page.rootElements ?? [])],
      }));

      // Find the source page.
      const sourcePage = updatedPages.find(
        (page) => page.id === activeData.pageId
      );

      if (!sourcePage) return previousPages;

      let draggedElement = null;

      // Remove the element from its original collection.
      if (activeData.collection === "rootElements") {
        const index = sourcePage.rootElements.findIndex(
          (item) => item.id === activeData.elementId
        );

        if (index !== -1) {
          [draggedElement] = sourcePage.rootElements.splice(index, 1);
        }
      } else {
        const sourceRow = sourcePage.rows.find(
          (row) => row.id === activeData.rowId
        );

        if (!sourceRow) return previousPages;

        const sourceItems = sourceRow[activeData.collection];

        if (!Array.isArray(sourceItems)) return previousPages;

        const index = sourceItems.findIndex(
          (item) => item.id === activeData.elementId
        );

        if (index !== -1) {
          [draggedElement] = sourceItems.splice(index, 1);
        }
      }

      if (!draggedElement) return previousPages;

      // Find the destination page.
      const targetPage = updatedPages.find(
        (page) => page.id === overData.pageId
      );

      if (!targetPage) return previousPages;

      // CASE 1:
      // Drop outside a row.
      // Move the element into rootElements (full width).
      if (overData.type === "rootDrop") {
        targetPage.rootElements.push(draggedElement);

        // Normalize after completing the drop.
        return normalizeRows(updatedPages);
      }

      if (overData.type !== "previewDrop") {
        return previousPages;
      }

      const {
        placement,
        targetRowId,
        targetElementId,
      } = overData;

      // CASE 2:
      // Drop above or below another element.
      // Create a new full-width row.
      if (placement === "top" || placement === "bottom") {
        // If the target is a root element,
        // insert into rootElements instead.
        if (overData.targetCollection === "rootElements") {
          const targetIndex = targetPage.rootElements.findIndex(
            (item) => item.id === targetElementId
          );

          if (targetIndex === -1) return previousPages;

          targetPage.rootElements.splice(
            placement === "top" ? targetIndex : targetIndex + 1,
            0,
            draggedElement
          );

          return normalizeRows(updatedPages);
        }

        // Find the target row.
        const targetIndex = targetPage.rows.findIndex(
          (row) => row.id === targetRowId
        );

        if (targetIndex === -1) return previousPages;

        // Create a new row using the dragged element's collection.
        const newRow = {
          id: crypto.randomUUID(),

          fields:
            activeData.collection === "fields"
              ? [draggedElement]
              : [],

          elements:
            activeData.collection === "fields"
              ? []
              : [draggedElement],
        };

        targetPage.rows.splice(
          placement === "top" ? targetIndex : targetIndex + 1,
          0,
          newRow
        );

        return normalizeRows(updatedPages);
      }

      // CASE 3:
      // Drop to the left or right of another element.
      // Insert into the target element's row.
      if (placement === "left" || placement === "right") {
        // Horizontal drop beside a root element.
        if (overData.targetCollection === "rootElements") {
          const targetIndex = targetPage.rootElements.findIndex(
            (item) => item.id === targetElementId
          );

          if (targetIndex === -1) return previousPages;

          targetPage.rootElements.splice(
            placement === "left"
              ? targetIndex
              : targetIndex + 1,
            0,
            draggedElement
          );

          return normalizeRows(updatedPages);
        }

        // Find the target row.
        const targetRow = targetPage.rows.find(
          (row) => row.id === targetRowId
        );

        if (!targetRow) return previousPages;

        const targetItems = targetRow[overData.targetCollection];

        if (!Array.isArray(targetItems)) return previousPages;

        const targetIndex = targetItems.findIndex(
          (item) => item.id === targetElementId
        );

        if (targetIndex === -1) return previousPages;

        targetItems.splice(
          placement === "left"
            ? targetIndex
            : targetIndex + 1,
          0,
          draggedElement
        );

        // IMPORTANT:
        // Normalize only AFTER inserting the dragged element.
        // This allows left/right drops within the same row to work.
        return normalizeRows(updatedPages);
      }

      return previousPages;
    });
  };

  // =========================================
  // PREVIEW COLLISION DETECTION
  // Preview drop zones take priority over the
  // large root drop area underneath them.
  // =========================================

  const previewCollisionDetection = (args) => {
    const collisions = pointerWithin(args);

    const edgeCollisions = collisions.filter(
      (collision) =>
        collision.data?.droppableContainer?.data.current?.type ===
        "previewDrop"
    );

    if (edgeCollisions.length > 0) {
      return edgeCollisions;
    }

    return collisions.filter(
      (collision) =>
        collision.data?.droppableContainer?.data.current?.type ===
        "rootDrop"
    );
  };

  // =========================================
  // MOVE ELEMENTS BETWEEN LOCATIONS
  // Handles dragging elements from ElementsPanel
  // into preview drop zones or another sidebar row.
  // =========================================

  const moveElementBetweenLocations = (activeData, overData) => {
    setPages((previousPages) => {
      let draggedElement = null;

      // First remove the element from its original location.
      let updatedPages = previousPages.map((page) => {
        if (page.id !== activeData.pageId) return page;

        const rows = (page.rows ?? []).map((row) => {
          const fields = [...(row.fields ?? [])];
          const elements = [...(row.elements ?? [])];

          // Remove a field from its original row.
          if (
            activeData.type === "field" &&
            row.id === activeData.rowId
          ) {
            const index = fields.findIndex(
              (item) => `field-${item.id}` === activeData.itemId
            );

            if (index !== -1) {
              draggedElement = fields[index];
              fields.splice(index, 1);
            }
          }

          // Remove a created element from its original row.
          if (
            activeData.type === "element" &&
            row.id === activeData.rowId
          ) {
            const index = elements.findIndex(
              (item) => `element-${item.id}` === activeData.itemId
            );

            if (index !== -1) {
              draggedElement = elements[index];
              elements.splice(index, 1);
            }
          }

          return { ...row, fields, elements };
        });

        // Handle elements outside rows.
        const rootElements = [...(page.rootElements ?? [])];

        if (activeData.type === "rootElement") {
          const index = rootElements.findIndex(
            (item) => `element-${item.id}` === activeData.itemId
          );

          if (index !== -1) {
            draggedElement = rootElements[index];
            rootElements.splice(index, 1);
          }
        }

        return {
          ...page,
          rows,
          rootElements,
        };
      });

      if (!draggedElement) return previousPages;

      // Find the destination page.
      const targetPageIndex = updatedPages.findIndex(
        (page) => page.id === overData.pageId
      );

      if (targetPageIndex === -1) return previousPages;

      const targetPage = updatedPages[targetPageIndex];
      const rows = [...(targetPage.rows ?? [])];
      const placement = overData.placement;

      // CASE 1:
      // Vertical drop: create a new full-width row.
      if (
        overData.type === "previewDrop" &&
        (placement === "top" || placement === "bottom")
      ) {
        const targetIndex = rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetIndex === -1) return previousPages;

        const newRow = {
          id: crypto.randomUUID(),

          fields:
            activeData.type === "field"
              ? [draggedElement]
              : [],

          elements:
            activeData.type === "field"
              ? []
              : [draggedElement],
        };

        rows.splice(
          placement === "top" ? targetIndex : targetIndex + 1,
          0,
          newRow
        );

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        return normalizeRows(updatedPages);
      }

      // CASE 2:
      // Horizontal drop of a root element.
      // Create a separate full-width row.
      if (
        activeData.type === "rootElement" &&
        overData.type === "previewDrop" &&
        (placement === "left" || placement === "right")
      ) {
        const targetIndex = rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetIndex === -1) return previousPages;

        rows.splice(
          targetIndex + (placement === "right" ? 1 : 0),
          0,
          {
            id: crypto.randomUUID(),
            fields: [],
            elements: [draggedElement],
          }
        );

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        return normalizeRows(updatedPages);
      }

      // CASE 3:
      // Horizontal drop into a target row.
      if (
        overData.type === "previewDrop" &&
        (placement === "left" || placement === "right")
      ) {
        const targetRowIndex = rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetRowIndex === -1) return previousPages;

        const targetRow = rows[targetRowIndex];

        // Use the target collection when provided.
        // This allows fields and created elements to share a row.
        const targetArray =
          overData.targetCollection === "fields" ||
          overData.targetCollection === "elements"
            ? overData.targetCollection
            : activeData.type === "field"
              ? "fields"
              : "elements";

        const items = [...(targetRow[targetArray] ?? [])];

        const targetIndex = items.findIndex(
          (item) => item.id === overData.targetElementId
        );

        if (targetIndex === -1) return previousPages;

        items.splice(
          targetIndex + (placement === "right" ? 1 : 0),
          0,
          draggedElement
        );

        rows[targetRowIndex] = {
          ...targetRow,
          [targetArray]: items,
        };

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        // Normalize after insertion, not before.
        return normalizeRows(updatedPages);
      }

      // CASE 4:
      // Drop into a row inside ElementsPanel.
      if (overData.type === "rowDrop") {
        const targetRowIndex = rows.findIndex(
          (row) => row.id === overData.rowId
        );

        if (targetRowIndex === -1) return previousPages;

        const targetRow = rows[targetRowIndex];

        const targetArray =
          activeData.type === "field" ? "fields" : "elements";

        rows[targetRowIndex] = {
          ...targetRow,

          [targetArray]: [
            ...(targetRow[targetArray] ?? []),
            draggedElement,
          ],
        };

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        return normalizeRows(updatedPages);
      }

      return previousPages;
    });
  };

  // =========================================
  // EDITOR UI
  // =========================================

  return (
    <div className="template-editor">

      {/* Main content */}
      <div
        className={`template-editor__main ${
          collpase
            ? "template-editor__main--collapsed"
            : selectedElement?.type === "paragraph"
              ? "template-editor__main--paragraph"
              : "template-editor__main--expanded"
        }`}
      >

        {/* Sidebar */}
        <div
          className={`template-editor__sidebar ${
            collpase
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
                      onClick={() => setSelectedOption(option.label)}
                      className={`template-editor__option ${
                        selectedOption === option.label
                          ? "template-editor__option--selected"
                          : ""
                      } ${
                        collpase
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
                onClick={() => setCollapse((prev) => !prev)}
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
            {selectedElement ? (
              <ElementSettings
                element={selectedElement}
                onChange={updateSelectedElement}
                onClose={() => setSelectedElement(null)}
              />
            ) : (
              <Box paddingBlockStart="400">

                {/* Elements sidebar */}
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
              </Box>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="template-editor__preview">
          <DndContext
            sensors={sensors}
            collisionDetection={previewCollisionDetection}
            onDragEnd={handlePreviewDragEnd}
          >
            <LivePreview
              pages={pages}
              templateTitle={templateTitle}
              formSettings={selectedTemplate}
              selectedElementId={selectedElement?.id}
              onSelectElement={setSelectedElement}
              onDuplicateElement={handleDuplicateElement}
              onToggleElementVisibility={handleToggleElementVisibility}
              onDeleteElement={handleDeleteElement}
            />
          </DndContext>
        </div>

      </div>
    </div>
  );
}