
import React from "react";
import {
  BlockStack,
  InlineStack,
  TextField,
  Checkbox,
} from "@shopify/polaris";

function ButtonSettings({ element, onChange }) {
  const update = (key, value) => {
    onChange({
      ...element,
      [key]: value,
    });
  };

  return (
    <BlockStack gap="300">
      {/* Other options */}
      <Checkbox
        label="Other options"
        checked={Boolean(element.otherOption)}
        onChange={(checked) => update("otherOption", checked)}
      />

      {/* Other option settings */}
      {element.otherOption && (
        <BlockStack gap="300">
          <TextField
            label="Other label"
            value={element.otherLabel || ""}
            onChange={(value) => update("otherLabel", value)}
            autoComplete="off"
          />

          <TextField
            label="Other placeholder"
            value={element.otherPlaceholder || ""}
            onChange={(value) => update("otherPlaceholder", value)}
            autoComplete="off"
          />
        </BlockStack>
      )}

      {/* Multiple options */}
      <Checkbox
        label="Multiple options"
        checked={Boolean(element.multipleOptions)}
        onChange={(checked) => update("multipleOptions", checked)}
      />

      {/* Limit selections */}
      {element.multipleOptions && (
        <BlockStack gap="300">
          <Checkbox
            label="Limit selections"
            checked={Boolean(element.limitSelections)}
            onChange={(checked) => update("limitSelections", checked)}
          />

          {element.limitSelections && (
            <InlineStack gap="200" align="start" blockAlign="start">
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextField
                  label="Min selections"
                  type="number"
                  value={String(element.minSelections ?? 0)}
                  onChange={(value) => update("minSelections", value)}
                  autoComplete="off"
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <TextField
                  label="Max selections"
                  value={String(element.maxSelections ?? 10)}
                  onChange={(value) => update("maxSelections", value)}
                  autoComplete="off"
                />
              </div>
            </InlineStack>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}

export default ButtonSettings;
