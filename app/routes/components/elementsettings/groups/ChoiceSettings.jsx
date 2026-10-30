
import React, { useState } from "react";
import {
  BlockStack,
  InlineStack,
  Box,
  Text,
  TextField,
  Checkbox,
  Select,
  Button,
  Divider,
} from "@shopify/polaris";

export default function ChoiceSettings({ element, onChange }) {
    const type = String(element.type || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
    
    console.log("Element type:", element.type);
console.log("Normalized type:", type);
  const isCheckbox = ["checkbox", "checkbox_group", "checkboxes"].includes(type);
  const isRadio = ["radio", "radio_group"].includes(type);
  const isDropdown = ["dropdown", "select"].includes(type);

  const [bulkOptions, setBulkOptions] = useState("");

  // Update one setting without losing the other element properties.
  const update = (key, value) => {
    onChange({
      ...element,
      [key]: value,
    });
  };

  // Support options stored as objects.
  const options = Array.isArray(element.options)
    ? element.options
    : [];

  const addOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };

    update("options", [...options, newOption]);
  };

  const updateOption = (index, value) => {
    const updatedOptions = options.map((option, i) =>
      i === index
        ? { ...option, label: value, value: value }
        : option
    );

    update("options", updatedOptions);
  };

  const deleteOption = (index) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    update("options", updatedOptions);
  };

  const addBulkOptions = () => {
    const newLabels = bulkOptions
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!newLabels.length) return;

    const newOptions = newLabels.map((label, index) => ({
      id: `option-${Date.now()}-${index}`,
      label,
      value: label,
    }));

    update("options", [...options, ...newOptions]);
    setBulkOptions("");
  };

  const optionChoices = options.map((option) => ({
    label: option.label,
    value: option.value,
  }));

  const defaultValueOptions = [
    { label: "Please select", value: "" },
    ...optionChoices,
  ];

  return (
    <BlockStack gap="400">

      {/* DROPDOWN PLACEHOLDER */}
      {isDropdown && (
        <TextField
          label="Placeholder"
          value={element.placeholder || ""}
          onChange={(value) => update("placeholder", value)}
          autoComplete="off"
        />
      )}

      {/* OPTIONS - SHARED BY CHECKBOX, RADIO AND DROPDOWN */}
      {(isCheckbox || isRadio || isDropdown) && (
        <Box
          borderColor="border"
          borderWidth="025"
          borderRadius="200"
          padding="300"
        >
          <BlockStack gap="300">
            <InlineStack align="space-between">
              <Text variant="bodyMd" fontWeight="medium">
                Options
              </Text>
              <Text variant="bodySm" tone="subdued">
                Option Label
              </Text>
            </InlineStack>

            {options.map((option, index) => (
              <InlineStack
                key={option.id || index}
                align="center"
                gap="200"
                blockAlign="center"
              >
                <Text tone="subdued">⠿</Text>

                <Box width="100%">
                  <TextField
                    label={`Option ${index + 1}`}
                    labelHidden
                    value={option.label || ""}
                    onChange={(value) =>
                      updateOption(index, value)
                    }
                    autoComplete="off"
                  />
                </Box>

                <Button
                  variant="plain"
                  tone="critical"
                  onClick={() => deleteOption(index)}
                >
                  Delete
                </Button>
              </InlineStack>
            ))}

            <InlineStack gap="200">
              <Button onClick={addOption}>
                Add Option
              </Button>
            </InlineStack>

            <Divider />

            <Text variant="bodySm" fontWeight="medium">
              Bulk add options
            </Text>

            <TextField
              label="Bulk options"
              labelHidden
              multiline={3}
              placeholder={"Enter one option per line"}
              value={bulkOptions}
              onChange={setBulkOptions}
              autoComplete="off"
            />

            <Button
              onClick={addBulkOptions}
              disabled={!bulkOptions.trim()}
            >
              Bulk add Option
            </Button>
          </BlockStack>
        </Box>
      )}

      {/* CHECKBOX DEFAULT VALUE */}
      {isCheckbox && (
        <TextField
          label="Enter default value"
          value={element.defaultOptions || ""}
          onChange={(value) => update("defaultOptions", value)}
          multiline={3}
          autoComplete="off"
        />
      )}

      {/* RADIO AND DROPDOWN DEFAULT VALUE */}
      {(isRadio || isDropdown) && (
        <Select
          label="Select default value"
          options={defaultValueOptions}
          value={element.defaultOption || ""}
          onChange={(value) => update("defaultOption", value)}
        />
      )}

      {/* DROPDOWN SEARCH */}
      {isDropdown && (
        <>
          <Checkbox
            label="Enable search"
            checked={Boolean(element.selectWithSearch)}
            onChange={(value) =>
              update("selectWithSearch", value)
            }
          />

          <TextField
            label="Select icon"
            value={element.selectIcon || ""}
            onChange={(value) => update("selectIcon", value)}
            placeholder="Enter icon name"
            autoComplete="off"
          />
        </>
      )}

      {/* CHECKBOX AND RADIO OTHER OPTION */}
      {(isCheckbox || isRadio) && (
        <>
          <Checkbox
            label="Other option"
            checked={Boolean(element.otherOption)}
            onChange={(value) => update("otherOption", value)}
          />

          {element.otherOption && (
            <BlockStack gap="300">
              <TextField
                label="Other label"
                value={element.otherLabel || ""}
                onChange={(value) => update("otherLabel", value)}
                autoComplete="off"
              />

              {isRadio && (
                <TextField
                  label="Other placeholder"
                  value={element.otherPlaceholder || ""}
                  onChange={(value) =>
                    update("otherPlaceholder", value)
                  }
                  autoComplete="off"
                />
              )}
            </BlockStack>
          )}
        </>
      )}

      {/* CHECKBOX LIMIT SELECTIONS */}
      {isCheckbox && (
        <Checkbox
          label="Limit selections"
          checked={Boolean(element.limitSelections)}
          onChange={(value) =>
            update("limitSelections", value)
          }
        />
      )}

      {/* RADIO LABEL POSITION */}
      {isRadio && (
        <Checkbox
          label="Keep position of label"
          checked={Boolean(element.keepLabelPosition)}
          onChange={(value) =>
            update("keepLabelPosition", value)
          }
        />
      )}

      {/* NUMBER OF OPTIONS PER LINE */}
      {(isCheckbox || isRadio) && (
        <BlockStack gap="200">
          <Text variant="bodyMd">
            Number of options per line
          </Text>

          <InlineStack gap="200">
            {[5, 4, 3, 2, 1].map((number) => (
              <Button
                key={number}
                pressed={
                  Number(element.optionsPerLine || 1) === number
                }
                onClick={() => update("optionsPerLine", number)}
              >
                {number}
              </Button>
            ))}
          </InlineStack>
        </BlockStack>
      )}

    </BlockStack>
  );
}
