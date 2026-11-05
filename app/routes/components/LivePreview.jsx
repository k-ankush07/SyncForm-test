
import React from "react";

import {
  Text,
  Badge,
  Button,
  ButtonGroup,
  InlineStack,
  Box,
  Divider,
  BlockStack,
  Icon,
} from "@shopify/polaris";

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

// Drop zones around an element.
// top/bottom = insert a separate full-width row.
// left/right = insert elements side by side.
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

// Each preview element has its own drag behavior.

function DraggablePreviewElement({
  element,
  pageId,
  rowId,
  collection,
  selectedElementId,
  onSelectElement,
  onDuplicateElement,
  onToggleElementVisibility,
  onDeleteElement,
  onOpenElementPicker
}) {
  const isSelected = element.id === selectedElementId;
  const isHidden = element.visible === false;

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

  // =========================================
  // HANDLE DRAG FROM PREVIEW FIELD AND TOOLBAR
  // =========================================

  const handlePreviewPointerDown = (event) => {
    const target = event.target;

    // Do not start dragging from preview drop zones.
    if (target.closest(".preview-drop-zone")) {
      return;
    }

    // Allow dragging from anywhere inside the full preview element.
    // This includes labels, inputs, placeholders, and empty space.
    // The toolbar drag handle also works through this event.
    listeners?.onPointerDown?.(event);
  };
  const dragStyle = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: isDragging ? 100 : undefined,
      opacity: isDragging ? 0.45 : 1,
    }
    : undefined;


  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
      }}
      {...attributes}
      onPointerDown={handlePreviewPointerDown}
      onKeyDown={listeners?.onKeyDown}
      style={{
        ...dragStyle,
        display: isHidden ? "none" : undefined,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className={[
        "preview-element",
        isSelected ? "preview-element--selected" : "",
        isHidden ? "preview-element--hidden" : "",
        isDragging ? "preview-element--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelectElement?.(element)}
    >
      {/* Drop zones around the element */}

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

      {isSelected && (
        <div
          className="element-floating-toolbar"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Drag using toolbar */}
          <button
            type="button"
            title="Drag field"
            aria-label="Drag field"
            className="element-toolbar-button element-drag-handle"
            data-drag-handle
          >
            <Icon source={DragHandleIcon} />
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

      <PreviewField element={element} />
    </div>
  );

}
function FixedPreviewElement({
  element,
  selectedElementId,
  onSelectElement,
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
      <PreviewField element={element} />
    </div>
  );
}

// The empty preview area is a drop target for root elements.
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


export default function LivePreview({
  pages = [],
  templateTitle = "Untitled form",
  header,
  footer,
  formSettings = {},
  selectedElementId,
  onSelectElement,
  onDuplicateElement,
  onToggleElementVisibility,
  onDeleteElement,
  onOpenElementPicker,
}) {
  return (
    <div
      className={`live-preview live-preview--${formSettings.theme || "classic"
        }`}
    >
      <Box background="bg-surface" padding="300">
        <InlineStack
          align="space-between"
          blockAlign="center"
          gap="400"
        >
          <InlineStack blockAlign="center" gap="200">
            <Text variant="bodyMd" fontWeight="semibold">
              {templateTitle}
            </Text>

            <Badge>Draft</Badge>
          </InlineStack>

          <InlineStack blockAlign="center" gap="200">
            <ButtonGroup>
              <Button>Mobile</Button>
              <Button variant="primary">Desktop</Button>
            </ButtonGroup>

            <Button>English</Button>
            <Button disabled>Undo</Button>
            <Button disabled>Redo</Button>
          </InlineStack>
        </InlineStack>
      </Box>

      <Divider />

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
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                />
              )}

              {/* =========================================
                  PAGE CONTENT
                  Each page contains its own rows and
                  rootElements, but no separate header
                  or footer.
              ========================================= */}

              {pages
                .filter(
                  (page) =>
                    page.visible !== false && page.open
                )
                .map((page) => (
                  <div
                    key={page.id}
                    className="preview-page"
                  >

                    {/* =========================================
                        MIDDLE: Normal draggable form elements
                    ========================================= */}

                    <PreviewRootDropArea pageId={page.id}>
                      <BlockStack gap="400">

                        {/* Render rows only when they contain visible elements. */}
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
                            ].filter(
                              ({ element }) =>
                                element.visible !== false
                            );

                            return {
                              row,
                              rowItems,
                            };
                          })

                          // IMPORTANT: Empty rows are not rendered.
                          // This removes the empty row and its spacing.
                          .filter(({ rowItems }) => rowItems.length > 0)

                          .map(({ row, rowItems }) => (
                            <div
                              key={row.id}
                              className="preview-row"
                            >
                              <div
                                className="preview-row-grid"
                                style={{
                                  "--preview-column-count": rowItems.length,
                                }}
                              >
                                {rowItems.map(
                                  ({ element, collection }) => (
                                    <DraggablePreviewElement
                                      key={`${collection}-${element.id}`}
                                      element={element}
                                      pageId={page.id}
                                      rowId={row.id}
                                      collection={collection}
                                      selectedElementId={selectedElementId}
                                      onSelectElement={onSelectElement}
                                      onDuplicateElement={onDuplicateElement}
                                      onToggleElementVisibility={
                                        onToggleElementVisibility
                                      }
                                      onDeleteElement={onDeleteElement}
                                      onOpenElementPicker={onOpenElementPicker}
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          ))}

                        {/* Root elements remain full width. */}
                        <BlockStack gap="300">
                          {(page.rootElements ?? [])
                            .filter(
                              (element) => element.visible !== false
                            )
                            .map((element) => (
                              <DraggablePreviewElement
                                key={element.id}
                                element={element}
                                pageId={page.id}
                                rowId={null}
                                collection="rootElements"
                                selectedElementId={selectedElementId}
                                onSelectElement={onSelectElement}
                                onDuplicateElement={onDuplicateElement}
                                onToggleElementVisibility={
                                  onToggleElementVisibility
                                }
                                onDeleteElement={onDeleteElement}
                                onOpenElementPicker={onOpenElementPicker}
                              />
                            ))}
                        </BlockStack>

                        {/* Existing submit button */}
                        {/* {page.submitButton?.enabled && (
                          <Box paddingBlockStart="400">
                            <button
                              type="button"
                              className="Polaris-Button--primary end-btn"
                            >
                              {page.submitButton.label}
                            </button>
                          </Box>
                        )} */}

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
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                />
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

