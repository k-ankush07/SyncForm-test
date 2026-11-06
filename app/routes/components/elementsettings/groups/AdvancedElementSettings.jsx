
import React from "react";
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
    update("colors", colors.map((color, i) => i === index ? value : color));
  };

  return (
    <BlockStack gap="300">
      <ColorPickerField
        label="Default color"
        value={element.defaultColor || "#563D7C"}
        onChange={(value) => update("defaultColor", value)}
      />

      {isSwatch && (
        <>
          <Divider />
          <Text as="h3" variant="headingSm">Swatch colors</Text>

          {colors.map((color, index) => (
            <InlineStack key={index} gap="200" blockAlign="center">
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  background: color,
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <div style={{ flex: 1 }}>
                <TextField
                  label={`Color ${index + 1}`}
                  labelHidden
                  value={color}
                  onChange={(value) => updateColor(index, value)}
                  autoComplete="off"
                />
              </div>
              <Button
                variant="plain"
                tone="critical"
                onClick={() =>
                  update("colors", colors.filter((_, i) => i !== index))
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
export function ProductSettings({ element, onChange }) {
  return (
    <BlockStack gap="300">
      <TextField
        label="Search placeholder"
        value={element.placeholder || "Search products"}
        onChange={(value) =>
          updateElement(element, onChange, "placeholder", value)
        }
        autoComplete="off"
      />

      <Checkbox
        label="Allow multiple products"
        checked={Boolean(element.allowMultiple)}
        onChange={(value) =>
          updateElement(element, onChange, "allowMultiple", value)
        }
      />

      <Checkbox
        label="Show product image"
        checked={element.showProductImage !== false}
        onChange={(value) =>
          updateElement(element, onChange, "showProductImage", value)
        }
      />

      <Checkbox
        label="Show product price"
        checked={element.showProductPrice !== false}
        onChange={(value) =>
          updateElement(element, onChange, "showProductPrice", value)
        }
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

// HIDDEN
export function HiddenSettings({ element, onChange }) {
  return (
    <BlockStack gap="300">
      <TextField
        label="Field value"
        value={element.value || ""}
        onChange={(value) =>
          updateElement(element, onChange, "value", value)
        }
        autoComplete="off"
      />

      <Text as="p" tone="subdued" variant="bodySm">
        This value is submitted with the form but is not displayed to visitors.
      </Text>
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

  return (
    <BlockStack gap="300">
      <TextField
        label="Placeholder"
        value={element.placeholder || "Sign here"}
        onChange={(value) => update("placeholder", value)}
        autoComplete="off"
      />

      <ColorPickerField
        label="Pen color"
        value={element.penColor || "#000000"}
        onChange={(value) => update("penColor", value)}
      />

      <Checkbox
        label="Allow clearing signature"
        checked={element.allowClear !== false}
        onChange={(value) => update("allowClear", value)}
      />
    </BlockStack>
  );
}
