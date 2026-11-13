

import React, { useState, useRef } from "react";
import {
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Checkbox,
  Select,
  Button,
  Divider,
} from "@shopify/polaris";
import ColorPickerField from "../../RichTextEditor/ColorPickerField";
import RichTextEditor from "../../RichTextEditor/RichTextEditor";
import ColorInput from "../../RichTextEditor/ColorInput.jsx";


// Shared update helper
function updateElement(element, onChange, key, value) {
  onChange({ ...element, [key]: value });
}

// Normalize options while preserving existing image properties.
function normalizeOptions(options = []) {
  return options.map((option, index) =>
    typeof option === "string"
      ? { id: `option-${index}`, label: option, value: option, image: "" }
      : {
        ...option,
        id: option.id || `option-${index}`,
        label: option.label || "",
        value: option.value || "",
        image: option.image || "",
      }
  );
}

function OptionEditor({ element, onChange, images = false }) {
  const options = normalizeOptions(element.options || []);

  const save = (next) =>
    updateElement(element, onChange, "options", next);

  const add = () => {
    save([
      ...options,
      {
        id: `option-${Date.now()}`,
        label: `Option ${options.length + 1}`,
        value: `option_${options.length + 1}`,
        ...(images ? { image: "" } : {}),
      },
    ]);
  };

  const edit = (index, key, value) => {
    save(
      options.map((option, i) =>
        i === index ? { ...option, [key]: value } : option
      )
    );
  };

  const remove = (index) =>
    save(options.filter((_, i) => i !== index));

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        Options
      </Text>

      {options.map((option, index) => (
        <BlockStack key={option.id} gap="200">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="span" variant="bodyMd" fontWeight="medium">
              Option {index + 1}
            </Text>
            <Button
              variant="plain"
              tone="critical"
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </InlineStack>

          <TextField
            label="Label"
            value={option.label}
            onChange={(value) => edit(index, "label", value)}
            autoComplete="off"
          />

          <TextField
            label="Value"
            value={option.value}
            onChange={(value) => edit(index, "value", value)}
            autoComplete="off"
          />

          {images && (
            <TextField
              label="Image URL"
              value={option.image}
              onChange={(value) => edit(index, "image", value)}
              placeholder="https://example.com/image.jpg"
              autoComplete="off"
            />
          )}

          {images && option.image && (
            <img
              src={option.image}
              alt={option.label}
              style={{
                width: "72px",
                height: "72px",
                objectFit: "cover",
                borderRadius: "6px",
              }}
            />
          )}

          {index !== options.length - 1 && <Divider />}
        </BlockStack>
      ))}

      <Button onClick={add} fullWidth>
        Add option
      </Button>
    </BlockStack>
  );
}

// IMAGE OPTIONS + IMAGE DROPDOWN
export function ImageChoiceSettings({ element, onChange }) {
  const isDropdown = element.type === "image_dropdown";

  return (
    <BlockStack gap="300">
      <Checkbox
        label="Show option label"
        checked={element.showOptionLabel !== false}
        onChange={(value) =>
          updateElement(element, onChange, "showOptionLabel", value)
        }
      />

      {isDropdown && (
        <Select
          label="Image position"
          value={element.imagePosition || "left"}
          options={[
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ]}
          onChange={(value) =>
            updateElement(element, onChange, "imagePosition", value)
          }
        />
      )}

      <OptionEditor element={element} onChange={onChange} images />
    </BlockStack>
  );
}

// SWITCH
export function SwitchSettings({ element, onChange }) {
  return (
    <BlockStack gap="300">
      <Checkbox
        label="Default switch state (On)"
        checked={Boolean(element.defaultChecked)}
        onChange={(value) =>
          updateElement(element, onChange, "defaultChecked", value)
        }
      />

      <TextField
        label="On text"
        value={element.onText || "On"}
        onChange={(value) =>
          updateElement(element, onChange, "onText", value)
        }
        autoComplete="off"
      />

      <TextField
        label="Off text"
        value={element.offText || "Off"}
        onChange={(value) =>
          updateElement(element, onChange, "offText", value)
        }
        autoComplete="off"
      />
    </BlockStack>
  );
}

// COLOR PICKER + COLOR SWATCH
export function ColorSettings({ element, onChange }) {
  const isSwatch = element.type === "color_swatch";

  const colors = Array.isArray(element.colors)
    ? element.colors
    : ["#E53935", "#1E88E5", "#43A047", "#FDD835"];

  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  const updateColor = (index, value) => {
    update(
      "colors",
      colors.map((color, i) => (i === index ? value : color))
    );
  };

  return (
    <BlockStack gap="300">
      <ColorInput
        label="Default color"
        value={element.defaultColor || "#563D7C"}
        onChange={(value) => update("defaultColor", value)}
      />

      {isSwatch && (
        <>
          <Divider />

          <Text as="h3" variant="headingSm">
            Swatch colors
          </Text>

          {colors.map((color, index) => (
            <InlineStack key={index} gap="200" blockAlign="center">
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  background: color,
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1 }}>
                <ColorInput
                  label={`Color ${index + 1}`}
                  value={color}
                  onChange={(value) => updateColor(index, value)}
                />
              </div>

              <Button
                variant="plain"
                tone="critical"
                onClick={() =>
                  update(
                    "colors",
                    colors.filter((_, i) => i !== index)
                  )
                }
              >
                Remove
              </Button>
            </InlineStack>
          ))}

          <Button
            fullWidth
            onClick={() => update("colors", [...colors, "#000000"])}
          >
            Add color
          </Button>
        </>
      )}
    </BlockStack>
  );
}

// RATING LEVEL
export function RatingLevelSettings({ element, onChange }) {
  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  return (
    <BlockStack gap="300">
      <Select
        label="Maximum rating level"
        value={String(element.maxLevel || 5)}
        options={Array.from({ length: 9 }, (_, i) => ({
          label: String(i + 2),
          value: String(i + 2),
        }))}
        onChange={(value) => update("maxLevel", Number(value))}
      />

      <TextField
        label="Low label"
        value={element.lowLabel || ""}
        onChange={(value) => update("lowLabel", value)}
        placeholder="Poor"
        autoComplete="off"
      />

      <TextField
        label="High label"
        value={element.highLabel || ""}
        onChange={(value) => update("highLabel", value)}
        placeholder="Excellent"
        autoComplete="off"
      />
    </BlockStack>
  );
}

// RANGE SLIDER
export function RangeSliderSettings({ element, onChange }) {
  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  return (
    <BlockStack gap="300">
      <TextField
        label="Minimum value"
        type="number"
        value={String(element.min ?? 0)}
        onChange={(value) => update("min", value)}
        autoComplete="off"
      />

      <TextField
        label="Maximum value"
        type="number"
        value={String(element.max ?? 100)}
        onChange={(value) => update("max", value)}
        autoComplete="off"
      />

      <TextField
        label="Step"
        type="number"
        value={String(element.step ?? 1)}
        onChange={(value) => update("step", value)}
        autoComplete="off"
      />

      <TextField
        label="Default value"
        type="number"
        value={String(element.defaultValue ?? element.min ?? 0)}
        onChange={(value) => update("defaultValue", value)}
        autoComplete="off"
      />

      <Checkbox
        label="Show current value"
        checked={element.showRangeValue !== false}
        onChange={(value) => update("showRangeValue", value)}
      />
    </BlockStack>
  );
}

// PRODUCT

export function ProductSettings({
  element,
  onChange,
  products = [],
  productsLoading = false,
  hasMoreProducts = false,
  productsLoadingMore = false,
  onLoadMoreProducts,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  // Selected Shopify product IDs
  const selectedProductIds = Array.isArray(element.selectedProductIds)
    ? element.selectedProductIds
    : [];

  // Search loaded Shopify products
  const filteredProducts = products.filter((product) =>
    product.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Select or deselect a product
  const toggleProduct = (productId, checked) => {
    let nextSelectedIds;

    if (checked) {
      if (element.allowMultiple) {
        nextSelectedIds = [
          ...new Set([...selectedProductIds, productId]),
        ];
      } else {
        nextSelectedIds = [productId];
      }
    } else {
      nextSelectedIds = selectedProductIds.filter(
        (id) => id !== productId
      );
    }

    update("selectedProductIds", nextSelectedIds);
  };

  // Update multiple-selection setting without overwriting another update
  const handleMultipleChange = (value) => {
    onChange({
      ...element,
      allowMultiple: value,
      selectedProductIds:
        !value && selectedProductIds.length > 1
          ? [selectedProductIds[0]]
          : selectedProductIds,
    });
  };

  return (
    <BlockStack gap="400">

      {/* GENERAL SETTINGS */}
      <Text as="h3" variant="headingSm">
        General settings
      </Text>

      <TextField
        label="Search placeholder"
        value={element.placeholder || "Search products"}
        onChange={(value) => update("placeholder", value)}
        autoComplete="off"
      />

      <Checkbox
        label="Allow multiple products"
        checked={Boolean(element.allowMultiple)}
        onChange={handleMultipleChange}
      />

      <Divider />

      {/* SHOPIFY PRODUCTS */}
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingSm">
            Shopify products
          </Text>

          <Text as="span" tone="subdued" variant="bodySm">
            {selectedProductIds.length} selected
          </Text>
        </InlineStack>

        <TextField
          label="Search products"
          labelHidden
          placeholder="Search Shopify products..."
          value={searchQuery}
          onChange={setSearchQuery}
          autoComplete="off"
          clearButton
          onClearButtonClick={() => setSearchQuery("")}
        />

        {productsLoading ? (
          <Text as="p" tone="subdued">
            Loading Shopify products...
          </Text>
        ) : (
          <>
            {/* PRODUCT LIST - SCROLLING DOES NOT FETCH */}
            <div
              style={{
                maxHeight: "360px",
                overflowY: "auto",
                padding: "4px",
              }}
            >
              <BlockStack gap="200">
                {filteredProducts.map((product) => {
                  const selected = selectedProductIds.includes(
                    product.id
                  );

                  return (
                    <div
                      key={product.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        border: selected
                          ? "1px solid #008060"
                          : "1px solid #e1e3e5",
                        borderRadius: "8px",
                        background: selected ? "#f1f8f5" : "#fff",
                      }}
                    >
                      <Checkbox
                        label=""
                        labelHidden
                        checked={selected}
                        onChange={(checked) =>
                          toggleProduct(product.id, checked)
                        }
                      />

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.imageAlt || product.title}
                          style={{
                            width: "52px",
                            height: "52px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            background: "#f1f2f3",
                            borderRadius: "6px",
                          }}
                        />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          as="p"
                          variant="bodyMd"
                          fontWeight="medium"
                          truncate
                        >
                          {product.title}
                        </Text>

                        <Text
                          as="p"
                          variant="bodySm"
                          tone="subdued"
                        >
                          {product.price || "No price"}
                        </Text>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <Text as="p" tone="subdued">
                    {products.length === 0
                      ? "No Shopify products found."
                      : "No products match your search."}
                  </Text>
                )}
              </BlockStack>
            </div>

            {/* LOADING MORE INDICATOR */}
            {productsLoadingMore && (
              <Text as="p" tone="subdued" textAlign="center">
                Loading more products...
              </Text>
            )}

            {/* LOAD MORE BUTTON - MANUAL CLICK ONLY */}
            {hasMoreProducts && (
              <Button
                fullWidth
                onClick={onLoadMoreProducts}
                loading={productsLoadingMore}
                disabled={productsLoadingMore || !onLoadMoreProducts}
              >
                Load more products
              </Button>
            )}

            {!hasMoreProducts && products.length > 0 && (
              <Text as="p" tone="subdued" textAlign="center">
                You have reached the end of your products.
              </Text>
            )}
          </>
        )}
      </BlockStack>

      <Divider />

      {/* PRODUCT LAYOUT */}
      <Text as="h3" variant="headingSm">
        Product layout
      </Text>

      <Select
        label="Product layout"
        options={[
          { label: "Grid", value: "grid" },
          { label: "List", value: "list" },
        ]}
        value={element.productLayout || "grid"}
        onChange={(value) => update("productLayout", value)}
      />

      <Divider />

      {/* DISPLAY SETTINGS */}
      <Text as="h3" variant="headingSm">
        Display settings
      </Text>

      <Checkbox
        label="Show search bar"
        checked={element.showSearchBar !== false}
        onChange={(value) => update("showSearchBar", value)}
      />

      <Checkbox
        label="Show product image"
        checked={element.showProductImage !== false}
        onChange={(value) => update("showProductImage", value)}
      />

      <Checkbox
        label="Show product price"
        checked={element.showProductPrice !== false}
        onChange={(value) => update("showProductPrice", value)}
      />

    </BlockStack>
  );
}

// MATRIX
export function MatrixSettings({ element, onChange }) {
  const rows = Array.isArray(element.rows)
    ? element.rows
    : ["Row 1", "Row 2"];

  const columns = Array.isArray(element.columns)
    ? element.columns
    : ["Poor", "Good", "Great"];

  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  const editListItem = (list, key, index, value) =>
    update(key, list.map((item, i) => i === index ? value : item));

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">Rows</Text>

      {rows.map((row, index) => (
        <InlineStack key={index} gap="200" blockAlign="center">
          <div style={{ flex: 1 }}>
            <TextField
              label={`Row ${index + 1}`}
              labelHidden
              value={row}
              onChange={(value) => editListItem(rows, "rows", index, value)}
              autoComplete="off"
            />
          </div>
          <Button
            variant="plain"
            tone="critical"
            onClick={() => update("rows", rows.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </InlineStack>
      ))}

      <Button onClick={() => update("rows", [...rows, `Row ${rows.length + 1}`])}>
        Add row
      </Button>

      <Divider />

      <Text as="h3" variant="headingSm">Columns</Text>

      {columns.map((column, index) => (
        <InlineStack key={index} gap="200" blockAlign="center">
          <div style={{ flex: 1 }}>
            <TextField
              label={`Column ${index + 1}`}
              labelHidden
              value={column}
              onChange={(value) => editListItem(columns, "columns", index, value)}
              autoComplete="off"
            />
          </div>
          <Button
            variant="plain"
            tone="critical"
            onClick={() =>
              update("columns", columns.filter((_, i) => i !== index))
            }
          >
            Remove
          </Button>
        </InlineStack>
      ))}

      <Button
        onClick={() =>
          update("columns", [...columns, `Column ${columns.length + 1}`])
        }
      >
        Add column
      </Button>

      <Checkbox
        label="Require an answer for every row"
        checked={Boolean(element.requireEveryRow)}
        onChange={(value) => update("requireEveryRow", value)}
      />
    </BlockStack>
  );
}

// FEEDBACK
export function FeedbackSettings({ element, onChange }) {
  return (
    <BlockStack gap="300">
      <TextField
        label="Feedback question"
        value={element.content || ""}
        onChange={(value) =>
          updateElement(element, onChange, "content", value)
        }
        autoComplete="off"
      />

      <OptionEditor element={element} onChange={onChange} />

      <Checkbox
        label="Allow multiple selections"
        checked={Boolean(element.allowMultiple)}
        onChange={(value) =>
          updateElement(element, onChange, "allowMultiple", value)
        }
      />
    </BlockStack>
  );
}




// REPEATER
export function RepeaterSettings({ element, onChange }) {
  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  return (
    <BlockStack gap="300">
      <TextField
        label="Add button text"
        value={element.addButtonText || "Add more"}
        onChange={(value) => update("addButtonText", value)}
        autoComplete="off"
      />

      <TextField
        label="Minimum items"
        type="number"
        value={String(element.minItems ?? 1)}
        onChange={(value) => update("minItems", value)}
        autoComplete="off"
      />

      <TextField
        label="Maximum items"
        type="number"
        value={String(element.maxItems ?? 5)}
        onChange={(value) => update("maxItems", value)}
        autoComplete="off"
      />
    </BlockStack>
  );
}

// SIGNATURE

export function SignatureSettings({ element, onChange }) {
  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  const showCanvas = element.showCanvas !== false;
  const allowFileUpload = element.allowFileUpload === true;

  return (
    <BlockStack gap="300">

      {/* SIGNATURE OPTIONS */}
      <Text variant="headingSm" as="h3">
        Signature options
      </Text>

      <Checkbox
        label="Show signature canvas"
        checked={showCanvas}
        onChange={(value) => update("showCanvas", value)}
      />

      <Checkbox
        label="Allow signature file upload"
        checked={allowFileUpload}
        onChange={(value) => update("allowFileUpload", value)}
      />

      <Divider />

      {/* CANVAS SETTINGS */}
      {showCanvas && (
        <BlockStack gap="300">
          <Text variant="headingSm" as="h3">
            Signature canvas
          </Text>

          <TextField
            label="Placeholder"
            value={element.placeholder || "Sign here"}
            onChange={(value) => update("placeholder", value)}
            autoComplete="off"
          />

          <TextField
            label="Canvas height (px)"
            type="number"
            value={String(element.canvasHeight ?? 150)}
            onChange={(value) => update("canvasHeight", value)}
            autoComplete="off"
          />

          <ColorInput
            label="Pen color"
            value={element.penColor || "#000000"}
            onChange={(value) => update("penColor", value)}
          />

          <TextField
            label="Pen thickness (px)"
            type="number"
            value={String(element.penWidth ?? 2)}
            onChange={(value) => update("penWidth", value)}
            autoComplete="off"
          />

          <Checkbox
            label="Allow clearing signature"
            checked={element.allowClear !== false}
            onChange={(value) => update("allowClear", value)}
          />
        </BlockStack>
      )}

      {/* FILE UPLOAD SETTINGS */}
      {allowFileUpload && (
        <BlockStack gap="300">
          <Divider />

          <Text variant="headingSm" as="h3">
            Signature file upload
          </Text>

          <TextField
            label="Upload button text"
            value={element.uploadButtonText || "Upload signature"}
            onChange={(value) =>
              update("uploadButtonText", value)
            }
            autoComplete="off"
          />



          <Checkbox
            label="Allow replacing uploaded signature"
            checked={element.allowReplace !== false}
            onChange={(value) => update("allowReplace", value)}
          />
        </BlockStack>
      )}

    </BlockStack>
  );
}

// CUSTOM HTML
const MAX_CODE_LENGTH = 65535;

export function CustomHtmlSettings({ element, onChange, onDelete }) {
  const [dark, setDark] = useState(true);
  const gutterRef = useRef(null);

  const code = element.customCode || "";
  const lineCount = Math.max(1, code.split("\n").length);

  const theme = dark
    ? { bg: "#1e1e1e", text: "#d4d4d4", gutter: "#858585", border: "#1e1e1e" }
    : { bg: "#ffffff", text: "#1f2328", gutter: "#8c9196", border: "#e1e3e5" };

  const setCode = (value) =>
    updateElement(element, onChange, "customCode", value.slice(0, MAX_CODE_LENGTH));

  // Keep line numbers aligned with the textarea scroll
  const syncScroll = (e) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
  };

  // Tab inserts two spaces instead of leaving the field
  const handleKeyDown = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const { selectionStart, selectionEnd, value } = e.target;
    const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    setCode(next);
    requestAnimationFrame(() => {
      e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
    });
  };

  const sharedTextStyle = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: "12px",
    lineHeight: "20px",
  };

  return (
    <BlockStack gap="300">
      <InlineStack align="end" gap="100">
        <Button pressed={dark} onClick={() => setDark(true)}>🌙</Button>
        <Button pressed={!dark} onClick={() => setDark(false)}>☀️</Button>
      </InlineStack>

      <div
        style={{
          display: "flex",
          height: "320px",
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {/* Line numbers */}
        <div
          ref={gutterRef}
          aria-hidden
          style={{
            ...sharedTextStyle,
            padding: "10px 8px",
            textAlign: "right",
            color: theme.gutter,
            userSelect: "none",
            overflow: "hidden",
            minWidth: "36px",
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Editor */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          placeholder="Add the custom code"
          spellCheck={false}
          wrap="off"
          style={{
            ...sharedTextStyle,
            flex: 1,
            padding: "10px 8px",
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            color: theme.text,
            whiteSpace: "pre",
            overflow: "auto",
          }}
        />
      </div>

      <Text as="p" variant="bodySm" tone="subdued">
        {code.length} / {MAX_CODE_LENGTH}
      </Text>

      {onDelete && (
        <Button fullWidth tone="critical" onClick={onDelete}>
          Delete
        </Button>
      )}
    </BlockStack>
  );
}

export function ConsentSettings({
  element,
  onChange,
  onDelete,
}) {
  const updateElement = (key, value) => {
    onChange({
      ...element,
      [key]: value,
    });
  };

  return (
    <BlockStack gap="400">

      {/* Consent Text Editor */}
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm">
          Consent text
        </Text>

        <RichTextEditor
          value={element.label || ""}
          onChange={(value) => updateElement("label", value)}
        />
      </BlockStack>

      {/* Default selected checkbox */}
      <Checkbox
        label="Checked by default"
        checked={element.checkedByDefault ?? true}
        onChange={(value) =>
          updateElement("checkedByDefault", value)
        }
      />

      {/* Consent-only checkbox */}
      <Checkbox
        label="Used only to require user consent (value is not submitted)"
        checked={element.requireConsentOnly ?? false}
        onChange={(value) =>
          updateElement("requireConsentOnly", value)
        }
      />

      {/* Delete */}
      {onDelete && (
        <Button fullWidth tone="critical" onClick={onDelete}>
          Delete
        </Button>
      )}

    </BlockStack>
  );
}
//URL
export function UrlSettings({ element, onChange }) {
  const update = (key, value) =>
    updateElement(element, onChange, key, value);

  return (
    <BlockStack gap="300">

      <TextField
        label="Field label"
        value={element.label || "Website URL"}
        onChange={(value) => update("label", value)}
        autoComplete="off"
      />

      <TextField
        label="Placeholder"
        value={element.placeholder || "https://example.com"}
        onChange={(value) => update("placeholder", value)}
        autoComplete="off"
      />

      <TextField
        label="Field name (key)"
        value={element.name || "website_url"}
        onChange={(value) => update("name", value)}
        autoComplete="off"
        helpText="Used to identify this field in form submissions."
      />

      <Divider />

      <Text variant="headingSm" as="h3">
        Default value
      </Text>

      <TextField
        label="Default URL"
        labelHidden
        value={element.defaultValue || ""}
        onChange={(value) => update("defaultValue", value)}
        placeholder="https://yourwebsite.com"
        autoComplete="off"
        helpText="Pre-fill the field with a URL (optional)."
      />

      <Divider />

      <Text variant="headingSm" as="h3">
        Validation
      </Text>

      <Checkbox
        label="Validate URL format"
        checked={element.validateUrl !== false}
        onChange={(value) => update("validateUrl", value)}
      />

      <Checkbox
        label="Require HTTPS"
        checked={Boolean(element.requireHttps)}
        onChange={(value) => update("requireHttps", value)}
      />

      <Checkbox
        label="Make field required"
        checked={Boolean(element.required)}
        onChange={(value) => update("required", value)}
      />

      <Divider />

      <Text variant="headingSm" as="h3">
        Advanced options
      </Text>

      <Checkbox
        label="Show link icon"
        checked={element.showIcon !== false}
        onChange={(value) => update("showIcon", value)}
      />

      <Checkbox
        label="Open link in new tab"
        checked={element.openInNewTab !== false}
        onChange={(value) => update("openInNewTab", value)}
      />

      <TextField
        label="Allowed domains"
        value={element.allowedDomains || ""}
        onChange={(value) => update("allowedDomains", value)}
        placeholder="example.com, shopify.com"
        autoComplete="off"
        helpText="Leave empty to allow any valid domain."
      />

    </BlockStack>
  );
}

// HIDDEN

// HIDDEN FIELD SETTINGS

function normalizeConditionType(type = "") {
  return String(type).toLowerCase().replace(/[\s-]+/g, "_");
}

// Get fields from all pages, excluding hidden and static elements.
function getHiddenConditionFields(pages = [], currentElement) {
  const fields = [];

  const excludedTypes = [
    "hidden",
    "heading",
    "paragraph",
    "divider",
    "button",
    "html",
    "custom_html",
  ];

  pages.forEach((page) => {
    const pageElements = [
      ...(page.rootElements || []),
      ...(page.rows || []).flatMap((row) => [
        ...(row.fields || []),
        ...(row.elements || []),
      ]),
    ];

    pageElements.forEach((field) => {
      if (!field || typeof field !== "object" || !field.id) return;

      const type = normalizeConditionType(field.type);

      if (
        String(field.id) === String(currentElement.id) ||
        excludedTypes.includes(type)
      ) {
        return;
      }

      fields.push(field);
    });
  });

  return fields;
}

// Normalize field options for ChoiceList.
function getHiddenFieldOptions(field) {
  if (!field) return [];

  const options = field.options || field.choices || [];

  return options
    .map((option) => {
      if (typeof option === "string") {
        return {
          label: option,
          value: option,
        };
      }

      const label = option.label || option.name || option.value || "";
      const value = String(option.value ?? option.label ?? option.name ?? "");

      return { label, value };
    })
    .filter((option) => option.label && option.value);
}

// Identify the controller field type.
function getHiddenConditionType(field) {
  if (!field) return "text";

  const type = normalizeConditionType(field.type);
  const options = getHiddenFieldOptions(field);

  const multiChoiceTypes = [
    "checkboxes",
    "checkbox_group",
    "image_options",
  ];

  const booleanTypes = [
    "checkbox",
    "switch",
    "toggle",
  ];

  const numberTypes = [
    "number",
    "quantity",
    "range",
    "range_slider",
    "rating",
    "rating_star",
    "rating_level",
  ];

  const dateTypes = [
    "date",
    "datetime",
    "date_time",
    "datepicker",
    "date_picker",
  ];

  // Fields with multiple selectable answers.
  if (
    options.length > 0 &&
    (multiChoiceTypes.includes(type) || field.allowMultiple)
  ) {
    return "multiChoice";
  }

  // Single-choice fields.
  if (
    options.length > 0 ||
    [
      "radio",
      "radio_group",
      "select",
      "dropdown",
      "image_dropdown",
    ].includes(type)
  ) {
    return "choice";
  }

  // Checkbox and switch fields without answer options.
  if (booleanTypes.includes(type)) return "boolean";

  if (numberTypes.includes(type)) return "number";

  if (dateTypes.includes(type)) return "date";

  return "text";
}

export function HiddenSettings({
  element,
  onChange,
  pages = [],
}) {
    console.log("🔥 HIDDEN SETTINGS COMPONENT CALLED");
  const condition = element.conditionalLogic || {
    enabled: false,
    fieldId: "",
    operator: "equals",
    value: "",
    values: [],
    match: "any",
  };

  const update = (key, value) => {
    updateElement(element, onChange, key, value);
  };

  const updateCondition = (key, value) => {
    update("conditionalLogic", {
      ...condition,
      [key]: value,
    });
  };

  const conditionFields = getHiddenConditionFields(
    pages,
    element
  );

  const selectedField = conditionFields.find(
    (field) =>
      String(field.id) === String(condition.fieldId)
  );

  const conditionType = getHiddenConditionType(selectedField);

  const answerOptions = getHiddenFieldOptions(selectedField);

  const fieldOptions = [
    {
      label: "Select a field",
      value: "",
    },
    ...conditionFields.map((field) => ({
      label:
        field.label ||
        field.name ||
        field.type ||
        "Untitled field",
      value: String(field.id),
    })),
  ];

  const operatorOptions = {
    choice: [
      { label: "Is", value: "equals" },
      { label: "Is not", value: "not_equals" },
    ],

    multiChoice: [
      { label: "Contains any of", value: "contains_any" },
      { label: "Contains all of", value: "contains_all" },
      { label: "Contains none of", value: "contains_none" },
    ],

    boolean: [
      { label: "Is checked", value: "checked" },
      { label: "Is not checked", value: "not_checked" },
    ],

    text: [
      { label: "Equals", value: "equals" },
      { label: "Does not equal", value: "not_equals" },
      { label: "Contains", value: "contains" },
      { label: "Does not contain", value: "not_contains" },
      { label: "Is empty", value: "empty" },
      { label: "Is not empty", value: "not_empty" },
    ],

    number: [
      { label: "Equals", value: "equals" },
      { label: "Does not equal", value: "not_equals" },
      { label: "Greater than", value: "greater_than" },
      { label: "Less than", value: "less_than" },
      { label: "Is empty", value: "empty" },
      { label: "Is not empty", value: "not_empty" },
    ],

    date: [
      { label: "Is", value: "equals" },
      { label: "Is not", value: "not_equals" },
      { label: "Is before", value: "before" },
      { label: "Is after", value: "after" },
      { label: "Is empty", value: "empty" },
      { label: "Is not empty", value: "not_empty" },
    ],
  };

  const currentOperators =
    operatorOptions[conditionType] || operatorOptions.text;

  const noValueOperators = [
    "empty",
    "not_empty",
    "checked",
    "not_checked",
  ];

  const needsValue = !noValueOperators.includes(
    condition.operator
  );

  const handleFieldChange = (fieldId) => {
    update("conditionalLogic", {
      ...condition,
      fieldId,
      operator: "equals",
      value: "",
      values: [],
      match: "any",
    });
  };

  return (
    <BlockStack gap="400">

      {/* CONDITIONAL LOGIC */}
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm">
          Conditional logic
        </Text>

        <Checkbox
          label="Enable conditional logic"
          checked={Boolean(condition.enabled)}
          onChange={(value) =>
            updateCondition("enabled", value)
          }
        />

        {condition.enabled && (
          <BlockStack gap="300">

            {/* CONTROLLER FIELD */}
            <Select
              label="Show this field if"
              options={fieldOptions}
              value={condition.fieldId || ""}
              onChange={handleFieldChange}
              helpText="Choose the field that controls this hidden field."
            />

            {!conditionFields.length && (
              <Text as="p" variant="bodySm" tone="subdued">
                Add another form field first to use conditional logic.
              </Text>
            )}

            {/* CONDITION OPTIONS */}
            {selectedField && (
              <BlockStack gap="300">

                <Select
                  label="Condition"
                  options={currentOperators}
                  value={condition.operator || "equals"}
                  onChange={(value) => {
                    updateCondition("operator", value);
                    updateCondition("value", "");
                    updateCondition("values", []);
                  }}
                />

                {/* SINGLE CHOICE */}
                {needsValue && conditionType === "choice" && (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Select answer
                    </Text>

                    {answerOptions.length > 0 ? (
                      <ChoiceList
                        title="Select answer"
                        titleHidden
                        allowMultiple={false}
                        choices={answerOptions}
                        selected={
                          condition.value
                            ? [String(condition.value)]
                            : []
                        }
                        onChange={(values) =>
                          updateCondition(
                            "value",
                            values[0] || ""
                          )
                        }
                      />
                    ) : (
                      <Text as="p" tone="subdued">
                        This field has no available answers.
                      </Text>
                    )}
                  </BlockStack>
                )}

                {/* MULTIPLE CHOICE */}
                {needsValue && conditionType === "multiChoice" && (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Select answers
                    </Text>

                    {answerOptions.length > 0 ? (
                      <>
                        <ChoiceList
                          title="Select answers"
                          titleHidden
                          allowMultiple
                          choices={answerOptions}
                          selected={condition.values || []}
                          onChange={(values) =>
                            updateCondition("values", values)
                          }
                        />

                        <Select
                          label="Match answers"
                          value={condition.match || "any"}
                          options={[
                            {
                              label: "Match any selected answer",
                              value: "any",
                            },
                            {
                              label: "Match all selected answers",
                              value: "all",
                            },
                          ]}
                          onChange={(value) =>
                            updateCondition("match", value)
                          }
                        />
                      </>
                    ) : (
                      <Text as="p" tone="subdued">
                        This field has no available answers.
                      </Text>
                    )}
                  </BlockStack>
                )}

                {/* TEXT / NUMBER / DATE VALUE */}
                {needsValue &&
                  ["text", "number", "date"].includes(conditionType) && (
                    <TextField
                      label="Compare value"
                      type={
                        conditionType === "number"
                          ? "number"
                          : conditionType === "date"
                            ? "date"
                            : "text"
                      }
                      value={condition.value || ""}
                      onChange={(value) =>
                        updateCondition("value", value)
                      }
                      autoComplete="off"
                    />
                  )}

              </BlockStack>
            )}
          </BlockStack>
        )}
      </BlockStack>

      <Divider />

      {/* SUBMISSION SETTINGS */}
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm">
          Submission
        </Text>

        <Checkbox
          label="Include in form submissions"
          checked={element.includeInSubmission !== false}
          onChange={(value) =>
            update("includeInSubmission", value)
          }
        />

        <Text as="p" variant="bodySm" tone="subdued">
          Choose whether this hidden field's value is included
          when the customer submits the form.
        </Text>
      </BlockStack>

    </BlockStack>
  );
}

