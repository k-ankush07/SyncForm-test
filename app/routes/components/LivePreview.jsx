
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
} from "@shopify/polaris";

import PreviewField from "./PreviewField";

export default function LivePreview({
  pages = [],
  templateTitle = "Untitled form",
  formSettings = {},
  selectedElementId,
  onSelectElement,
  onDuplicateElement,
  onToggleElementVisibility,
  onDeleteElement,
}) {
  // Select an element when the user clicks it in the preview.
 
const renderElement = (element, key) => {
  if (!element || typeof element !== "object") {
    return (
      <div key={key} className="preview-element">
        <PreviewField field={element} />
      </div>
    );
  }

  const isSelected = element.id === selectedElementId;
  const isHidden = element.visible === false;

  return (
    <div
      key={key}
      className={[
        "preview-element",
        isSelected ? "preview-element--selected" : "",
        isHidden ? "preview-element--hidden" : "",
      ].filter(Boolean).join(" ")}
      onClick={() => onSelectElement?.(element)}
    >
      {isSelected && (
        <div
          className="element-floating-toolbar"
          contentEditable={false}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            title="Drag field"
            aria-label="Drag field"
            className="element-toolbar-button element-drag-handle"
          >
            ⠿
          </button>

          <button
            type="button"
            title="Layout settings"
            aria-label="Layout settings"
            className="element-toolbar-button"
            onClick={() => {
              onSelectElement?.(element);
            }}
          >
            ◫
          </button>

          <button
            type="button"
            title="Duplicate field"
            aria-label="Duplicate field"
            className="element-toolbar-button"
            onClick={() => onDuplicateElement?.(element)}
          >
            ▢
          </button>

          <button
            type="button"
            title={isHidden ? "Show field" : "Hide field"}
            aria-label={isHidden ? "Show field" : "Hide field"}
            className="element-toolbar-button"
            onClick={() => onToggleElementVisibility?.(element)}
          >
            {isHidden ? "◉" : "◌"}
          </button>

          <button
            type="button"
            title="Delete field"
            aria-label="Delete field"
            className="element-toolbar-button element-toolbar-button--delete"
            onClick={() => onDeleteElement?.(element)}
          >
            🗑
          </button>
        </div>
      )}

      <PreviewField element={element} />
    </div>
  );
};


  return (
    <div
      className={`live-preview live-preview--${
        formSettings.theme || "classic"
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
            <div className="live-preview__header">
              <Text
                as="h2"
                variant="headingLg"
                fontWeight="semibold"
              >
                {formSettings?.title || "Contact us"}
              </Text>

              <Text as="p" variant="bodyMd" tone="subdued">
                {formSettings?.description ||
                  "Leave your message and we'll get back to you shortly."}
              </Text>
            </div>

            <div className="live-preview__content">
              {pages
                .filter((page) => page.visible !== false && page.open)
                .map((page) => (
                  <div key={page.id} className="preview-page">
                    <BlockStack gap="400">
                      {(page.rows ?? []).map((row) => (
                        <div key={row.id} className="preview-row">
                          <div className="preview-row-grid">
                            {(row.fields ?? []).map(
                              (field, index) =>
                                renderElement(
                                  field,
                                  typeof field === "object"
                                    ? field.id
                                    : `${field}-${index}`
                                )
                            )}

                            {(row.elements ?? []).map(
                              (element, index) =>
                                renderElement(
                                  element,
                                  element.id ?? `element-${index}`
                                )
                            )}
                          </div>
                        </div>
                      ))}

                      <BlockStack gap="300">
                        {(page.rootElements ?? []).map(
                          (element, index) =>
                            renderElement(
                              element,
                              element.id ?? `root-${index}`
                            )
                        )}
                      </BlockStack>

                      {page.submitButton?.enabled && (
                        <Box paddingBlockStart="400">
                          <button
                            type="button"
                            className="Polaris-Button--primary end-btn"
                          >
                            {page.submitButton.label}
                          </button>
                        </Box>
                      )}
                    </BlockStack>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
