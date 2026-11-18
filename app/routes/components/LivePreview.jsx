// =====================================================================
// LivePreview.jsx
//
// FLOW OVERVIEW
// ---------------------------------------------------------------------
// LivePreview draws the form exactly as visitors will see it, and lets
// the user edit it directly inside the preview:
//
//   LivePreview (default export)
//     |- FixedPreviewElement  -> shared Header (selectable, not draggable)
//     |- For each open page:
//     |    |- PreviewRootDropArea     -> drop target for standalone elements
//     |         |- For each visible row:
//     |         |    |- PreviewRowInsert (before)   -> "+" between rows
//     |         |    |- standalone elements placed BEFORE this row
//     |         |    |- row grid of DraggablePreviewElement items
//     |         |    |- standalone elements placed AFTER this row
//     |         |    |- PreviewRowInsert (after, last row only)
//     |         |- Remaining standalone (root) elements, full width
//     |- FixedPreviewElement  -> shared Footer (selectable, not draggable)
//
//   DraggablePreviewElement
//     |- PreviewDropZone x2-4  -> top / bottom / left / right drop + "+"
//     |- Floating toolbar      -> drag, width, duplicate, hide, delete
//     |- PreviewField          -> the real rendered field
//
// All data changes are sent to the parent through callbacks
// (onSelectElement, onChangeElement, onDeleteElement ...).
// Drag & drop results are handled by the parent's DndContext.
//
// FILE ORDER
//   1. Imports
//   2. PreviewDropZone        (drop + insert around an element)
//   3. PreviewRowInsert       (drop + insert between rows)
//   4. DraggablePreviewElement
//   5. FixedPreviewElement    (header / footer)
//   6. PreviewRootDropArea    (drop area for standalone elements)
//   7. LivePreview            (main component)
// =====================================================================


// =====================================================================
// 1. IMPORTS
// =====================================================================

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
import { getElementSettingsType } from "../components/elementsettings/utils/elementSettingsConfig";


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
      <span className="preview-drop-line" />

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
      <span className="preview-row-insert__line" />

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
  onFieldChange, // recive new prop 
  onDuplicateElement,
  onToggleElementVisibility,
  onDeleteElement,
  onOpenElementPicker,
  onChangeElement,
  products = [],
  productsLoading = false,
  isModelPreview = false,
}) {
  const isSelected = element.id === selectedElementId;
  const isHidden = element.visible === false;



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
    disabled: isHidden,
    data: {
      type: "previewElement",
      pageId,
      rowId,
      collection,
      elementId: element.id,
    },
  });

  // ---------------------------------------------------------------
  // HANDLE DRAG FROM PREVIEW FIELD AND TOOLBAR
  // Dragging starts from anywhere on the element, except from
  // interactive controls (inputs, selects, buttons, dialogs ...).
  // ---------------------------------------------------------------

  const handlePreviewPointerDown = (event) => {
    const target = event.target;

    // Ignore the actual popup.
    if (target.closest(".Polaris-Popover")) {
      return;
    }

    // Color input is allowed to initiate dragging.
    const isColorInput = target.closest(".color-input-activator");

    // Allow dragging directly from Star Rating buttons.
    const isRatingStarButton = target.closest(".rating-star-button");

    if (
      !isColorInput &&
      !isRatingStarButton &&
      target.closest(
        [
          ".preview-drop-zone",
          "input:not([readonly])",

          "select",
          "button",
          "[role='dialog']",
          "[contenteditable='true']",
        ].join(",")
      )
    ) {
      return;
    }

    // Start DnD Kit pointer sensor.
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
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
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
      onPointerDown={handlePreviewPointerDown}
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
      onClick={() => onSelectElement?.(element)}
    >
      {/* ---------- DROP ZONES AROUND THE ELEMENT ---------- */}

      {/* Standalone/root elements can have top and bottom insertion. */}
      {rowId === null && (
        <>
          <PreviewDropZone
            pageId={pageId}
            rowId={rowId}
            elementId={element.id}
            collection={collection}
            placement="top"
            onOpenElementPicker={onOpenElementPicker}
          />

          <PreviewDropZone
            pageId={pageId}
            rowId={rowId}
            elementId={element.id}
            collection={collection}
            placement="bottom"
            onOpenElementPicker={onOpenElementPicker}
          />
        </>
      )}

      {/* Every element can have left and right insertion. */}
      <PreviewDropZone
        pageId={pageId}
        rowId={rowId}
        elementId={element.id}
        collection={collection}
        placement="left"
        onOpenElementPicker={onOpenElementPicker}
      />

      <PreviewDropZone
        pageId={pageId}
        rowId={rowId}
        elementId={element.id}
        collection={collection}
        placement="right"
        onOpenElementPicker={onOpenElementPicker}
      />

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
            title={columnWidth === 50 ? "Set full width" : "Set half width"}
            aria-label={columnWidth === 50 ? "Set full width" : "Set half width"}
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
        onChange={onFieldChange} //pass here to track changes form
        products={products}
        productsLoading={productsLoading}
        isModelPreview={isModelPreview}
      />
    </div>
  );
}


// =====================================================================
// 5. FIXED PREVIEW ELEMENT
// Used for the shared Header and Footer. They are selectable but
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
  // Footer navigation actions
  onPrevious,
  onNext,
  onReset,
  onSubmit,
}) {
  if (!element) return null;

  const isSelected = element.id === selectedElementId;

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
      onClick={() => onSelectElement?.(element)}
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

  //for debugging 
  // DEBUG: Show currently selected element
  const selectedElement = [
    header,
    footer,
    ...pages.flatMap((page) => [
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

  //states 
  // Stores all answers entered by the customer.
  const [formValues, setFormValues] = React.useState({});

  // Stores whether the form has been submitted.
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  //fn to store these values in a obj
  const handleFieldChange = (fieldId, nextValue) => {
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldId]: nextValue,
    }));
  };
  React.useEffect(() => {
    console.log("Customer answers:", formValues);
  }, [formValues]);

  // use to get the info about the cirrent opage for navigation 
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

  // Go to previous page.
  const handlePreviousPage = () => {
    setCurrentCustomerPageIndex((previousIndex) =>
      Math.max(0, previousIndex - 1)
    );
  };

  // Go to next page.
const handleNextPage = () => {
  console.log("NEXT clicked", { currentCustomerPageIndex, total: customerPages.length });
  setCurrentCustomerPageIndex((i) => Math.min(customerPages.length - 1, i + 1));
};

React.useEffect(() => {
  console.log("page index now:", currentCustomerPageIndex, customerPages.map(p => p.id));
}, [currentCustomerPageIndex]);

  // Reset customer answers.
  const handleResetForm = () => {
    setFormValues({});
    setIsSubmitted(false);
    setCurrentCustomerPageIndex(0);
  };

  // Submit will be connected to validation in our next step.
  const handleSubmitForm = () => {
    console.log("Form submitted:", formValues);
  };

  // Check whether an element should be rendered.
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

  // Renders one draggable element. Used for both:
  //   - elements inside a row   (rowId = row.id, collection = "fields" / "elements")
  //   - standalone root elements (rowId = null,  collection = "rootElements")
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

  return (
    <div
      className={[
        `live-preview live-preview--${formSettings.theme || "classic"}`,
        isMobilePreview ? "live-preview--mobile-preview" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="live-preview__body">
        <div className="live-preview__form">
          <div className="live-preview__data">

            <div className="live-preview__content">

              {/* =========================================
                  SHARED HEADER
                  Rendered only ONCE for the entire form.
                  It is not inside pages.map().
                  It is selectable but NOT draggable.
              ========================================= */}

              {header && header.visible !== false && (
                <FixedPreviewElement
                  element={header}
                  activePageId={activePageId}
                  pages={pages}
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                  products={products}
                  productsLoading={productsLoading}
                  isModelPreview={isModelPreview}
                />
              )}

              {/* =========================================
                  PAGE CONTENT
                  Each page contains its own rows and
                  rootElements, but no separate header
                  or footer. Only the open page is shown.
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
              ).map((page) => (
                <div
                  key={page.id}
                  className="preview-page"
                >

                  <PreviewRootDropArea pageId={page.id}>
                    <BlockStack gap="">

                      {/* =========================================
                            ROWS
                            Only rows that contain visible elements
                            are rendered.
                        ========================================= */}

                      {(page.rows ?? [])

                        // Hide the complete row when its visibility is false.
                        .filter((row) => row.visible !== false)

                        .map((row) => {
                          // Combine fields and elements into one list.
                          // This lets the grid support any number of items.
                          const rowItems = [
                            ...(row.fields ?? []).map((field) => ({
                              element: field,
                              collection: "fields",
                            })),

                            ...(row.elements ?? []).map((element) => ({
                              element,
                              collection: "elements",
                            })),
                          ].filter(({ element }) => shouldRenderElement(element));

                          return {
                            row,
                            rowItems,
                          };
                        })

                        // IMPORTANT: Empty rows are not rendered.
                        // This removes the empty row and its spacing.
                        .filter(({ rowItems }) => rowItems.length > 0)

                        .map(({ row, rowItems }, index, allRows) => (
                          <React.Fragment key={row.id}>

                            {/* Add element before this row */}
                            <PreviewRowInsert
                              pageId={page.id}
                              rowId={row.id}
                              placement="before"
                              onOpenElementPicker={onOpenElementPicker}
                            />

                            {/* Standalone elements positioned before this row */}
                            {(page.rootElements ?? [])
                              .filter(
                                (element) =>
                                  shouldRenderElement(element) &&
                                  element.insertBeforeRowId === row.id
                              )
                              .map((element) => renderRootElement(element, page))}

                            {/* The row itself (grid of elements) */}
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
                                  element.insertAfterRowId === row.id
                              )
                              .map((element) => renderRootElement(element, page))}

                            {/* Add element after the last row */}
                            {index === allRows.length - 1 && (
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

                      <BlockStack gap="300">
                        {(page.rootElements ?? [])
                          .filter(
                            (element) =>
                              shouldRenderElement(element) &&
                              !element.insertBeforeRowId &&
                              !element.insertAfterRowId
                          )
                          .map((element) => renderRootElement(element, page))}
                      </BlockStack>

                    </BlockStack>
                  </PreviewRootDropArea>

                </div>
              ))}

              {/* =========================================
                  SHARED FOOTER
                  Rendered only ONCE for the entire form.
                  It is not inside pages.map().
                  It is selectable but NOT draggable.
              ========================================= */}

              {footer && footer.visible !== false && (
                <FixedPreviewElement
                  element={footer}
                  activePageId={activePageId}
                  pages={pages}
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                  isModelPreview={isModelPreview}
                  //new
                  isFirstCustomerPage={isFirstCustomerPage}
                  isLastCustomerPage={isLastCustomerPage}
                  onPrevious={handlePreviousPage}
                  onNext={handleNextPage}
                  onReset={handleResetForm}
                  onSubmit={handleSubmitForm}
                />
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}