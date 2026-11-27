
// =====================================================================
// My LivePreview
// =====================================================================
// LivePreview.jsx
//
// FLOW OVERVIEW
// ---------------------------------------------------------------------
// LivePreview draws the form exactly as visitors will see it and lets
// the user edit it directly inside the preview:
//
//   LivePreview (default export)
//     |- For each open page:
//     |    |- FixedPreviewElement -> Page Header
//     |    |- PreviewRootDropArea -> drop target for standalone elements
//     |    |    |- For each visible row:
//     |    |    |    |- PreviewRowInsert (before)
//     |    |    |    |- standalone elements placed BEFORE this row
//     |    |    |    |- row grid of DraggablePreviewElement items
//     |    |    |    |- standalone elements placed AFTER this row
//     |    |    |    |- PreviewRowInsert (after, last row only)
//     |    |    |- Remaining standalone (root) elements
//     |    |- FixedPreviewElement -> Page Footer
//
//   DraggablePreviewElement
//     |- PreviewDropZone x2-4
//     |- Floating toolbar
//     |- PreviewField
//
// All data changes are sent to the parent through callbacks.
// Drag & drop results are handled by the parent's DndContext.
//
// FILE ORDER
//   1. Imports
//   2. PreviewDropZone
//   3. PreviewRowInsert
//   4. DraggablePreviewElement
//   5. FixedPreviewElement
//   6. PreviewRootDropArea
//   7. LivePreview
// =====================================================================
// 1. IMPORTS
// =====================================================================
// aggable
import React from "react";

import { BlockStack, Icon } from "@shopify/polaris";

import {
  DragHandleIcon,
  LayoutColumns3Icon,
  DuplicateIcon,
  HideIcon,
  ViewIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";

import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

import PreviewField from "./PreviewField";
import { validateElement } from "./elementValidation.js";
import { getElementSettingsType } from "../components/elementsettings/utils/elementSettingsConfig";
import { ELEMENT_TYPES } from "../../utils/elementsConfig.js";


// =====================================================================
// 2. PREVIEW DROP ZONE
// Drop zones around an element.
//   top / bottom = insert a separate full-width row
//   left / right = insert elements side by side
// Each zone also has a "+" button that opens the element picker.
// =====================================================================
function PreviewDropZone({
  pageId,
  rowId,
  elementId,
  collection,
  placement,
  onOpenElementPicker,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `preview-drop-${pageId}-${rowId}-${collection}-${elementId}-${placement}`,
    data: {
      type: "previewDrop",
      pageId,
      targetRowId: rowId,
      targetElementId: elementId,
      targetCollection: collection,
      placement,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        "preview-drop-zone",
        `preview-drop-zone--${placement}`,
        isOver ? "preview-drop-zone--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Clicking the line opens the element picker */}
      <span
        className="preview-drop-line"
        onClick={(event) => {
          event.stopPropagation();

          onOpenElementPicker?.(
            {
              pageId,
              rowId,
              elementId,
              collection,
              placement,
            },
            event
          );
        }}
      />

      {/* Existing + button */}
      <button
        type="button"
        className="preview-insert-button"
        aria-label={`Insert element ${placement}`}
        title={`Add element ${placement}`}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();

          onOpenElementPicker?.(
            {
              pageId,
              rowId,
              elementId,
              collection,
              placement,
            },
            event
          );
        }}
      >
        +
      </button>
    </div>
  );
}

// =====================================================================
// 3. PREVIEW ROW INSERT
// Drop zone + "+" button placed between rows
// (placement is "before" or "after" the given row).
// =====================================================================

function PreviewRowInsert({
  pageId,
  rowId,
  placement,
  onOpenElementPicker,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `preview-row-insert-${pageId}-${rowId}-${placement}`,
    data: {
      type: "previewRowInsert",
      pageId,
      targetRowId: rowId,
      placement,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`preview-row-insert ${isOver ? "preview-row-insert--active" : ""
        }`}
    >
      {/* Clicking the line opens the element picker */}
      <span
        className="preview-row-insert__line"
        onClick={(event) => {
          event.stopPropagation();

          onOpenElementPicker?.(
            {
              pageId,
              rowId,
              placement,
              collection: "rows",
            },
            event
          );
        }}
        style={{ cursor: "pointer" }}
      />

      <button
        type="button"
        className="preview-insert-button"
        title="Add element between rows"
        aria-label="Add element between rows"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();

          onOpenElementPicker?.(
            {
              pageId,
              rowId,
              placement,
              collection: "rows",
            },
            event
          );
        }}
      >
        +
      </button>
    </div>
  );
}


// =====================================================================
// 4. DRAGGABLE PREVIEW ELEMENT
// One element in the preview. It can be dragged, selected, and shows
// a floating toolbar while selected.
// =====================================================================

function DraggablePreviewElement({
  element,
  pageId,
  pages,
  rowId,
  collection,
  selectedElementId,
  onSelectElement,
  onFieldChange,
  onDuplicateElement,
  onToggleElementVisibility,
  onDeleteElement,
  onOpenElementPicker,
  onChangeElement,
  products = [],
  productsLoading = false,
  savedValue,
  isModelPreview = false,
  error,
}) {
  // This prevents the editor's selection toolbar from appearing
  // in customer preview mode.
  const isSelected =
    !isModelPreview && element.id === selectedElementId;

  const isHidden = element.visible === false;
  const elementTypeConfig = ELEMENT_TYPES.find(
    (item) => item.type === element.type
  );
  // console.log("PREVIEW ELEMENT:", {
  //   elementId: element.id,
  //   elementType: element.type,
  //   rowId,
  //   collection,
  // });

  // Drag behavior for this element.
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `preview-element-${pageId}-${collection}-${element.id}`,
    disabled: isHidden || isModelPreview,
    data: {
      type: "previewElement",
      pageId,
      rowId,
      collection,
      elementId: element.id,
      label: elementTypeConfig?.label || element.type,
      icon: elementTypeConfig?.icon,
    },
  });

  // ---------------------------------------------------------------
  // HANDLE DRAG FROM PREVIEW FIELD AND TOOLBAR
  // Dragging starts from anywhere on the element, except from
  // interactive controls (inputs, selects, buttons, dialogs ...).
  // ---------------------------------------------------------------


  // Prevent editor controls from keeping keyboard focus.
  const handlePreviewMouseDown = (event) => {
    if (isModelPreview) return;

    const target = event.target;

    if (!(target instanceof Element)) return;

    if (
      target.closest(
        "input, textarea, select, button, [role='combobox'], [contenteditable='true']"
      )
    ) {
      // Prevent the browser's default focus behavior.
      // This does not cancel the earlier pointer event used by DnD Kit.
      event.preventDefault();
    }
  };

  // Remove focus if a control receives it through another interaction.
  const handlePreviewFocus = (event) => {
    if (isModelPreview) return;

    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    if (
      target.matches(
        "input, textarea, select, button, [role='combobox'], [contenteditable='true']"
      )
    ) {
      target.blur();
    }
  };

  // Prevent editor-mode controls from executing their customer-facing actions.
  const handlePreviewClick = (event) => {
    if (isModelPreview) return;

    const target = event.target;

    if (!(target instanceof Element)) return;

    if (
      target.closest(
        ".preview-drop-zone, .element-floating-toolbar, .Polaris-Popover"
      )
    ) {
      return;
    }

    if (
      target.closest(
        "input, textarea, select, button, [role='combobox'], [contenteditable='true']"
      )
    ) {
      event.preventDefault();
    }
  };

  // ---------------------------------------------------------------
  // START DRAGGING FROM ANYWHERE INSIDE THE PREVIEW FIELD
  // ---------------------------------------------------------------

  const handlePreviewPointerDown = (event) => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    // Do not start dragging from insertion zones or editor popups.
    if (
      target.closest(
        ".preview-drop-zone, .Polaris-Popover, .element-floating-toolbar"
      )
    ) {
      return;
    }

    // Start DnD Kit pointer sensor.
    // This also allows dragging directly from inputs and dropdowns.
    listeners?.onPointerDown?.(event);
  };


  // ---------------------------------------------------------------
  // STYLE
  // Column width is clamped between 1% and 100%.
  // ---------------------------------------------------------------

  const columnWidth = Math.min(
    100,
    Math.max(1, Number(element.columnWidth) || 100)
  );

  const dragStyle = {
    // transform: transform
    //   ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    //   : undefined,

    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.45 : 1,
    "--element-column-width": `${columnWidth}%`,
    flex: `0 1 ${columnWidth}%`,
    width: `${columnWidth}%`,
    minWidth: 0,
    boxSizing: "border-box",
  };




  return (

    <div
      ref={setNodeRef}
      {...attributes}

      // Select the field before its child control handles the pointer.


      onPointerDownCapture={(event) => {
        if (isModelPreview) return;

        const target = event.target;

        if (!(target instanceof Element)) return;



        // Ignore editor controls.
        if (
          target.closest(
            [
              ".preview-drop-zone",
              ".element-floating-toolbar",
              ".Polaris-Popover",
            ].join(",")
          )
        ) {
          return;
        }

        // Select the field and pass the page it belongs to.
        onSelectElement?.(element, pageId);

        // Do not preventDefault here.
        // DnD Kit needs the pointer event to start dragging.
      }}



      // Keep your existing drag behavior.
      onMouseDownCapture={handlePreviewMouseDown}
      onFocusCapture={handlePreviewFocus}
      onPointerDown={handlePreviewPointerDown}
      onClickCapture={handlePreviewClick}

      style={{
        ...dragStyle,
        display: isHidden ? "none" : undefined,
        cursor: isDragging ? "grabbing" : "default",
      }}

      className={[
        "preview-element",
        element.customClass || "",
        isSelected ? "preview-element--selected" : "",
        isHidden ? "preview-element--hidden" : "",
        isDragging ? "preview-element--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {/* ---------- DROP ZONES AROUND THE ELEMENT ---------- */}
      {/* Standalone/root elements can have top and bottom insertion. */}
      {rowId === null && (
        <>
          {!isModelPreview && (
            <PreviewDropZone
              pageId={pageId}
              rowId={rowId}
              elementId={element.id}
              collection={collection}
              placement="top"
              onOpenElementPicker={onOpenElementPicker}
            />
          )}

          {!isModelPreview && (
            <PreviewDropZone
              pageId={pageId}
              rowId={rowId}
              elementId={element.id}
              collection={collection}
              placement="bottom"
              onOpenElementPicker={onOpenElementPicker}
            />
          )}
        </>
      )}

      {/* Every element can have left and right insertion. */}
      {!isModelPreview && (
        <PreviewDropZone
          pageId={pageId}
          rowId={rowId}
          elementId={element.id}
          collection={collection}
          placement="left"
          onOpenElementPicker={onOpenElementPicker}
        />
      )}

      {!isModelPreview && (
        <PreviewDropZone
          pageId={pageId}
          rowId={rowId}
          elementId={element.id}
          collection={collection}
          placement="right"
          onOpenElementPicker={onOpenElementPicker}
        />
      )}

      {/* ---------- FLOATING TOOLBAR (selected element only) ---------- */}

      {isSelected && (
        <div
          className="element-floating-toolbar"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Drag using toolbar */}
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            type="button"
            title="Drag field"
            aria-label="Drag field"
            className="element-toolbar-button element-drag-handle"
            data-drag-handle
          >
            <Icon source={DragHandleIcon} />
          </button>

          {/* Toggle element width (50% <-> 100%) */}
          <button
            type="button"
            title={
              columnWidth === 50
                ? "Set full width"
                : "Set half width"
            }
            aria-label={
              columnWidth === 50
                ? "Set full width"
                : "Set half width"
            }
            className="element-toolbar-button"
            onClick={() => {
              onChangeElement?.({
                ...element,
                columnWidth: columnWidth === 50 ? 100 : 50,
              });
            }}
          >
            <Icon source={LayoutColumns3Icon} />
          </button>

          {/* Duplicate field */}
          <button
            type="button"
            title="Duplicate field"
            aria-label="Duplicate field"
            className="element-toolbar-button"
            onClick={() => onDuplicateElement?.(element)}
          >
            <Icon source={DuplicateIcon} />
          </button>

          {/* Hide / Show field */}
          <button
            type="button"
            title={isHidden ? "Show field" : "Hide field"}
            aria-label={isHidden ? "Show field" : "Hide field"}
            className="element-toolbar-button"
            onClick={() => onToggleElementVisibility?.(element)}
          >
            <Icon source={isHidden ? ViewIcon : HideIcon} />
          </button>

          {/* Delete field */}
          <button
            type="button"
            title="Delete field"
            aria-label="Delete field"
            className="element-toolbar-button element-toolbar-button--delete"
            onClick={() => onDeleteElement?.(element)}
          >
            <Icon source={DeleteIcon} />
          </button>
        </div>
      )}

      {/* ---------- THE ACTUAL RENDERED FIELD ---------- */}

      <PreviewField
        element={element}
        pages={pages}
        onChange={onFieldChange}
        products={products}
        productsLoading={productsLoading}
        isModelPreview={isModelPreview}
        error={error}
        savedValue={savedValue}
      />

      {/* This shows the error for the field that has an error. */}
      {error && (
        <div
          role="alert"
          style={{
            color: "#D72C0D",
            fontSize: "13px",
            marginTop: "4px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}


// =====================================================================
// 5. FIXED PREVIEW ELEMENT
// Used for the page Header and Footer. They are selectable but
// NOT draggable, and have no drop zones.
// =====================================================================

function FixedPreviewElement({
  element,
  pages = [],
  activePageId,
  selectedElementId,
  onSelectElement,
  products = [],
  isFirstCustomerPage,
  isLastCustomerPage,
  productsLoading = false,
  isModelPreview = false,

  // Identifies the page when this is a custom header/footer.
  // null means this is the shared header/footer.
  selectionPageId = null,

  // Footer navigation actions
  onPrevious,
  onNext,
  onReset,
  onSubmit,
}) {
  if (!element) return null;

  // Now clicking the footer in editor mode selects it,
  // but clicking the footer in customer preview mode
  // will not open its settings.
  const isSelected =
    !isModelPreview && element.id === selectedElementId;

  const type = String(element.type || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const isHeader = type === "form_header";
  const isFooter = type === "form_footer";

  return (
    <div
      className={[
        "preview-element",
        "preview-fixed-element",
        element.customClass || "",
        isSelected ? "preview-element--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDownCapture={() => {
        if (!isModelPreview) {
          console.log("HEADER/FOOTER SELECTED:", {
            elementId: element.id,
            elementType: element.type,
            selectionPageId,
          });

          onSelectElement?.(element, selectionPageId);
        }
      }}
      style={{
        cursor: "pointer",

        // Fixed spacing for header and footer.
        marginTop: isHeader || isFooter ? "20px" : undefined,
        marginBottom: isHeader || isFooter ? "30px" : undefined,
      }}
    >
      <PreviewField
        element={element}
        pages={pages}
        activePageId={activePageId}
        products={products}
        productsLoading={productsLoading}
        isModelPreview={isModelPreview}
        onPrevious={onPrevious}
        onNext={onNext}
        onReset={onReset}
        onSubmit={onSubmit}
        isFirstCustomerPage={isFirstCustomerPage}
        isLastCustomerPage={isLastCustomerPage}
      />
    </div>
  );
}


// =====================================================================
// 6. PREVIEW ROOT DROP AREA
// The whole page content area is a drop target for root
// (standalone, full-width) elements.
// =====================================================================

function PreviewRootDropArea({ pageId, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `preview-root-drop-${pageId}`,
    data: {
      type: "rootDrop",
      pageId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`preview-root-drop-area ${isOver ? "preview-root-drop-area--active" : ""
        }`}
    >
      {children}
    </div>
  );
}


const getPreviewRowItemDragId = (item, index) => {
  if (
    item &&
    typeof item === "object" &&
    item.id != null
  ) {
    return `field-${item.id}`;
  }

  if (typeof item === "string") {
    return `field-${encodeURIComponent(
      item.trim().toLowerCase()
    )}`;
  }

  const fieldName =
    item?.name ||
    item?.label ||
    item?.type;

  if (fieldName) {
    return `field-${encodeURIComponent(
      String(fieldName).trim().toLowerCase()
    )}`;
  }

  return `field-index-${index}`;
};

// =====================================================================
// 7. LIVE PREVIEW (default export)
// =====================================================================

export default function LivePreview({
  pages = [],
  activePageId,
  header,
  footer,
  formSettings = {},
  selectedElementId,
  onSelectElement,
  onDuplicateElement,
  onToggleElementVisibility,
  onDeleteElement,
  onOpenElementPicker,
  onChangeElement,
  products = [],
  productsLoading = false,
  isMobilePreview = false,
  isModelPreview = false,
}) {

  // ---------------------------------------------------------------
  // DEBUG: Show currently selected element.
  // Includes shared and page-specific headers/footers.
  // ---------------------------------------------------------------

  const selectedElement = [
    header,
    footer,

    ...pages.flatMap((page) => [
      // Include this page's custom header/footer.
      page.header,
      page.footer,

      ...(page.rows ?? []).flatMap((row) => [
        ...(row.fields ?? []),
        ...(row.elements ?? []),
      ]),

      ...(page.rootElements ?? []),
    ]),
  ].find((element) => element?.id === selectedElementId);

  const selectedElementGroup = selectedElement
    ? getElementSettingsType(selectedElement.type)
    : null;

  console.log("========== SELECTED ELEMENT ==========");
  console.log("Element ID:", selectedElementId);
  console.log("Element Type:", selectedElement?.type);
  console.log("Element Group:", selectedElementGroup);
  console.log("Complete Element:", selectedElement);
  console.log("=======================================");


  // ---------------------------------------------------------------
  // STATES
  // ---------------------------------------------------------------

  // Stores validation errors using each field's ID.
  const [validationErrors, setValidationErrors] = React.useState({});

  // Stores all answers entered by the customer.
  const [formValues, setFormValues] = React.useState({});

  // Stores whether the form has been submitted.
  const [isSubmitted, setIsSubmitted] = React.useState(false);


  // ---------------------------------------------------------------
  // HANDLE CUSTOMER FIELD CHANGES
  // When the customer corrects a field, its previous error is cleared.
  // ---------------------------------------------------------------

  const handleFieldChange = (fieldId, nextValue) => {
    // Update the customer's answer.
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldId]: nextValue,
    }));

    // Clear this field's old error when the customer edits it.
    setValidationErrors((previousErrors) => {
      if (!previousErrors[fieldId]) {
        return previousErrors;
      }

      const updatedErrors = { ...previousErrors };
      delete updatedErrors[fieldId];

      return updatedErrors;
    });
  };

  React.useEffect(() => {
    console.log("Customer answers:", formValues);
  }, [formValues]);


  // ---------------------------------------------------------------
  // CUSTOMER PAGE NAVIGATION
  // ---------------------------------------------------------------

  // Customer's current page (separate from editor page selection).
  const [currentCustomerPageIndex, setCurrentCustomerPageIndex] =
    React.useState(0);

  // Only pages visible to customers.
  const customerPages = pages.filter(
    (page) => page.visible !== false
  );

  // Current customer page.
  const currentCustomerPage =
    customerPages[currentCustomerPageIndex];

  // Check whether customer is on first or last page.
  const isFirstCustomerPage = currentCustomerPageIndex === 0;

  const isLastCustomerPage =
    currentCustomerPageIndex === customerPages.length - 1;

  // Keep the current page index valid if pages are hidden or deleted.
  React.useEffect(() => {
    setCurrentCustomerPageIndex((previousIndex) =>
      Math.min(
        Math.max(0, previousIndex),
        Math.max(0, customerPages.length - 1)
      )
    );
  }, [customerPages.length]);


  // Go to previous page.
  const handlePreviousPage = () => {
    setCurrentCustomerPageIndex((previousIndex) =>
      Math.max(0, previousIndex - 1)
    );
  };


  // Move to the next visible customer page.
  const handleNextPage = () => {
    // First, validate the currently displayed customer page.
    const isPageValid = validatePage(currentCustomerPage);

    // If any field has an error, stop here.
    if (!isPageValid) {
      return;
    }

    // All fields are valid, so move to the next page.
    setCurrentCustomerPageIndex((previousIndex) =>
      Math.min(customerPages.length - 1, previousIndex + 1)
    );
  };


  React.useEffect(() => {
    console.log(
      "page index now:",
      currentCustomerPageIndex,
      customerPages.map((page) => page.id)
    );
  }, [currentCustomerPageIndex]);


  // Reset customer answers.
  const handleResetForm = () => {
    setFormValues({});
    setIsSubmitted(false);
    setCurrentCustomerPageIndex(0);
  };


  // ---------------------------------------------------------------
  // SUBMIT FORM
  // ---------------------------------------------------------------

  const handleSubmitForm = () => {
    // Collect fields from every visible customer page.
    const allFields = getCustomerFields();

    // Store all validation errors here.
    const allErrors = {};

    // Validate every field.
    allFields.forEach((field) => {
      const error = validateElement(
        field,
        formValues[field.id]
      );

      if (error) {
        allErrors[field.id] = error;
      }
    });

    // Update the validation errors shown in the preview.
    setValidationErrors(allErrors);

    // Check whether any field is invalid.
    if (Object.keys(allErrors).length > 0) {
      // Find the first page that contains an invalid field.
      const firstInvalidPageIndex = customerPages.findIndex((page) => {
        const pageFields = getCustomerFields(page);

        return pageFields.some(
          (field) => allErrors[field.id]
        );
      });

      // Navigate to that page.
      if (firstInvalidPageIndex !== -1) {
        setCurrentCustomerPageIndex(firstInvalidPageIndex);
      }

      // Stop submission.
      return;
    }

    // All fields are valid.
    setIsSubmitted(true);

    console.log("Form submitted:", formValues);
  };


  // ---------------------------------------------------------------
  // CHECK WHETHER AN ELEMENT SHOULD BE RENDERED
  // ---------------------------------------------------------------

  const shouldRenderElement = (element) => {
    const type = String(element?.type || "")
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_");

    // Completely skip dividers when Hide divider is enabled.
    if (type === "divider" && element.hideDivider) {
      return false;
    }

    return element.visible !== false;
  };


  // ---------------------------------------------------------------
  // PAGE-SPECIFIC HEADER AND FOOTER
  // ---------------------------------------------------------------

  // Each page uses its custom header when enabled.
  // Otherwise, it uses the shared default header.
  const getPageHeader = (page) => {
    return page.useCustomHeader === true
      ? page.header
      : header;
  };

  // Each page uses its custom footer when enabled.
  // Otherwise, it uses the shared default footer.
  const getPageFooter = (page) => {
    return page.useCustomFooter === true
      ? page.footer
      : footer;
  };

  // =====================================================================
  // GET ALL CUSTOMER-FACING FIELDS THAT NEED VALIDATION.
  //
  // Collects fields from:
  // 1. Visible customer pages
  // 2. Visible rows
  // 3. Visible row fields and elements
  // 4. Visible root elements
  //
  // Excludes static and hidden elements.
  // =====================================================================

  const getCustomerFields = (pageToCollect = null) => {
    const pagesToCollect = pageToCollect
      ? [pageToCollect]
      : customerPages;

    const nonInputTypes = [
      "heading",
      "paragraph",
      "html",
      "divider",
      "form_header",
      "form_footer",
      "hidden",
    ];

    const customerFields = [];

    pagesToCollect.forEach((page) => {
      // Skip hidden pages.
      if (page.visible === false) {
        return;
      }

      // Collect fields from rows.
      (page.rows || []).forEach((row) => {
        // Skip hidden rows.
        if (row.visible === false) {
          return;
        }

        const rowElements = [
          ...(row.fields || []),
          ...(row.elements || []),
        ];

        rowElements.forEach((element) => {
          const type = String(element?.type || "")
            .toLowerCase()
            .trim()
            .replace(/[\s-]+/g, "_");

          if (!element?.id) return;
          if (!shouldRenderElement(element)) return;
          if (nonInputTypes.includes(type)) return;

          customerFields.push(element);
        });
      });

      // Collect standalone root elements.
      (page.rootElements || []).forEach((element) => {
        const type = String(element?.type || "")
          .toLowerCase()
          .trim()
          .replace(/[\s-]+/g, "_");

        if (!element?.id) return;
        if (!shouldRenderElement(element)) return;
        if (nonInputTypes.includes(type)) return;

        customerFields.push(element);
      });
    });

    return customerFields;
  };


  // =====================================================================
  // VALIDATE ALL CUSTOMER-FACING FIELDS ON ONE PAGE.
  // Returns true when every field on that page is valid.
  // =====================================================================

  const validatePage = (page = currentCustomerPage) => {
    if (!page) {
      return true;
    }

    // Get only the fields belonging to this page.
    const fields = getCustomerFields(page);

    const pageErrors = {};
    const currentFieldIds = fields.map((field) => field.id);

    // Validate each field using its current value.
    fields.forEach((field) => {
      const error = validateElement(
        field,
        formValues[field.id]
      );

      if (error) {
        pageErrors[field.id] = error;
      }
    });

    // Remove old errors for this page and store the new errors.
    setValidationErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors };

      currentFieldIds.forEach((fieldId) => {
        delete updatedErrors[fieldId];
      });

      return {
        ...updatedErrors,
        ...pageErrors,
      };
    });

    // If there are no errors, the page is valid.
    return Object.keys(pageErrors).length === 0;
  };


  // ---------------------------------------------------------------
  // RENDER ONE DRAGGABLE ELEMENT.
  //
  // Used for both:
  //   - elements inside a row (rowId = row.id)
  //   - standalone root elements (rowId = null)
  // ---------------------------------------------------------------

  const renderPreviewElement = ({
    element,
    page,
    rowId,
    collection,
    key,
  }) => (
    <DraggablePreviewElement
      key={key}
      element={element}
      onFieldChange={handleFieldChange}
      pageId={page.id}
      pages={pages}
      rowId={rowId}
      collection={collection}
      selectedElementId={selectedElementId}
      onSelectElement={onSelectElement}
      onDuplicateElement={onDuplicateElement}
      onToggleElementVisibility={onToggleElementVisibility}
      onDeleteElement={onDeleteElement}
      onOpenElementPicker={onOpenElementPicker}
      onChangeElement={onChangeElement}
      products={products}
      productsLoading={productsLoading}
      isModelPreview={isModelPreview}
      error={validationErrors[element.id]}
      savedValue={formValues[element.id]}
    />
  );


  // Standalone (root) element rendered at full width.
  const renderRootElement = (element, page) =>
    renderPreviewElement({
      element,
      page,
      rowId: null,
      collection: "rootElements",
      key: element.id,
    });


  // =====================================================================
  // MAIN RENDER
  // =====================================================================

  return (
    <div
      className={[
        `live-preview live-preview--${formSettings.theme || "classic"}`,
        isMobilePreview ? "live-preview--mobile-preview" : "",
        isModelPreview ? "live-preview--customer" : "live-preview--editor",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="live-preview__body">
        <div className="live-preview__form">
          <div className="live-preview__data">

            <div className="live-preview__content">

              {/* =========================================
                  PAGE CONTENT

                  Each page chooses its own header/footer
                  using its custom header/footer checkboxes
                  Custom Footer OFF -> shared footer
                  Custom Footer ON  -> page.footer
              ========================================= */}

              {(
                isModelPreview
                  ? currentCustomerPage
                    ? [currentCustomerPage]
                    : []
                  : pages.filter(
                    (page) =>
                      page.visible !== false && page.open
                  )
              ).map((page) => {
                // Prepare only rows that actually contain visible elements.

                const visibleRows = (page.rows ?? [])
                  .filter((row) => row.visible !== false)
                  .map((row) => {
                    const combinedItems = [
                      ...(row.fields ?? []).map((field, index) => ({
                        element: field,
                        collection: "fields",
                        dragId: getPreviewRowItemDragId(field, index),
                      })),

                      ...(row.elements ?? []).map((element) => ({
                        element,
                        collection: "elements",
                        dragId: `element-${element.id}`,
                      })),
                    ].filter(({ element }) => shouldRenderElement(element));

                    // Restore the same mixed order used by Elements Panel.
                    const savedOrder = row.itemOrder ?? [];

                    combinedItems.sort((a, b) => {
                      const indexA = savedOrder.indexOf(a.dragId);
                      const indexB = savedOrder.indexOf(b.dragId);

                      if (indexA === -1 && indexB === -1) return 0;
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;

                      return indexA - indexB;
                    });

                    return {
                      row,
                      rowItems: combinedItems,
                    };
                  })
                  .filter(({ rowItems }) => rowItems.length > 0);


                // IDs of rows that are actually rendered.
                const renderedRowIds = new Set(
                  visibleRows.map(({ row }) => String(row.id))
                );

                // Get the correct header and footer for this page.
                const pageHeader = getPageHeader(page);
                const pageFooter = getPageFooter(page);
                console.log("PAGE HEADER DEBUG:", {
                  pageId: page.id,
                  pageTitle: page.title,
                  useCustomHeader: page.useCustomHeader,
                  hasPageHeader: Boolean(page.header),
                  pageHeaderId: page.header?.id,
                  sharedHeaderId: header?.id,
                  isCustomHeader:
                    page.useCustomHeader === true &&
                    Boolean(page.header),
                });

                // Determine whether this page uses its custom header/footer.
                const isCustomHeader = page.useCustomHeader === true;
                const isCustomFooter = page.useCustomFooter === true;

                return (
                  <div
                    key={page.id}
                    className="preview-page"
                  >

                    {/* =========================================
                        PAGE HEADER

                        Custom Header ON:
                          Render page.header

                        Custom Header OFF:
                          Render shared header
                    ========================================= */}

                    {pageHeader &&
                      pageHeader.visible !== false &&
                      pageHeader.showHeader !== false && (
                        <FixedPreviewElement
                          element={pageHeader}
                          pages={pages}
                          activePageId={page.id}
                          selectedElementId={selectedElementId}
                          onSelectElement={onSelectElement}
                          products={products}
                          productsLoading={productsLoading}
                          isModelPreview={isModelPreview}

                          // Custom header belongs to this page.
                          // Shared header belongs to the entire form.
                          selectionPageId={
                            isCustomHeader ? page.id : null
                          }
                        />
                      )}


                    {/* =========================================
                        PAGE CONTENT
                        Each page contains its own rows and
                        rootElements.
                    ========================================= */}

                    <PreviewRootDropArea pageId={page.id}>
                      <BlockStack >

                        {/* =========================================
                            ROWS
                            Only rows that contain visible elements
                            are rendered.
                        ========================================= */}

                        {visibleRows.map(({ row, rowItems }, index, allRows) => (
                          <React.Fragment key={row.id}>

                            {/* Add element before this row */}
                            {!isModelPreview && (
                              <PreviewRowInsert
                                pageId={page.id}
                                rowId={row.id}
                                placement="before"
                                onOpenElementPicker={onOpenElementPicker}
                              />
                            )}

                            {/* Standalone elements positioned before this row */}
                            {(page.rootElements ?? [])
                              .filter(
                                (element) =>
                                  shouldRenderElement(element) &&
                                  String(element.insertBeforeRowId) === String(row.id)
                              )
                              .map((element) =>
                                renderRootElement(element, page)
                              )}

                            {/* The row itself */}
                            <div className="preview-row">
                              <div
                                className="preview-row-grid"
                                style={{
                                  "--preview-column-count": rowItems.length,
                                }}
                              >
                                {rowItems.map(({ element, collection }) =>
                                  renderPreviewElement({
                                    element,
                                    page,
                                    rowId: row.id,
                                    collection,
                                    key: `${collection}-${element.id}`,
                                  })
                                )}
                              </div>
                            </div>

                            {/* Standalone elements positioned after this row */}
                            {(page.rootElements ?? [])
                              .filter(
                                (element) =>
                                  shouldRenderElement(element) &&
                                  String(element.insertAfterRowId) === String(row.id)
                              )
                              .map((element) =>
                                renderRootElement(element, page)
                              )}

                            {/* Add element after the last row */}
                            {!isModelPreview && index === allRows.length - 1 && (
                              <PreviewRowInsert
                                pageId={page.id}
                                rowId={row.id}
                                placement="after"
                                onOpenElementPicker={onOpenElementPicker}
                              />
                            )}

                          </React.Fragment>
                        ))}


                        {/* =========================================
                            ROOT ELEMENTS

                            Standalone elements that are not tied to
                            a row position. They remain full width.
                        ========================================= */}

                        <BlockStack gap="100">
                          {(page.rootElements ?? [])
                            .filter((element) => {
                              if (!shouldRenderElement(element)) {
                                return false;
                              }

                              const anchorId =
                                element.insertBeforeRowId ||
                                element.insertAfterRowId;

                              // Normal root elements without an anchor.
                              if (!anchorId) {
                                return true;
                              }

                              // If the original row no longer exists in the preview,
                              // render the root element here instead of hiding it.
                              return !renderedRowIds.has(String(anchorId));
                            })
                            .map((element) =>
                              renderRootElement(element, page)
                            )}
                        </BlockStack>

                      </BlockStack>
                    </PreviewRootDropArea>


                    {/* =========================================
                        PAGE FOOTER

                        Custom Footer ON:
                          Render page.footer

                        Custom Footer OFF:
                          Render shared footer
                    ========================================= */}

                    {pageFooter && pageFooter.visible !== false && (
                      <FixedPreviewElement
                        element={pageFooter}
                        pages={pages}
                        activePageId={page.id}
                        selectedElementId={selectedElementId}
                        onSelectElement={onSelectElement}
                        products={products}
                        productsLoading={productsLoading}
                        isModelPreview={isModelPreview}

                        // Custom footer belongs to this page.
                        // Shared footer belongs to the entire form.
                        selectionPageId={
                          isCustomFooter ? page.id : null
                        }

                        // Keep existing customer navigation.
                        isFirstCustomerPage={isFirstCustomerPage}
                        isLastCustomerPage={isLastCustomerPage}
                        onPrevious={handlePreviousPage}
                        onNext={handleNextPage}
                        onReset={handleResetForm}
                        onSubmit={handleSubmitForm}
                      />
                    )}

                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}