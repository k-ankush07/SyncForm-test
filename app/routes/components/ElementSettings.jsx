
import React from "react";

import {
  Box,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Checkbox,
  Select,
  Divider,
  Button,
  ButtonGroup,
  Icon,
  Tooltip,
} from "@shopify/polaris";

import {
  ArrowLeftIcon,
  MagicIcon,
  InfoIcon,
} from "@shopify/polaris-icons";

export default function ElementSettings({
  element,
  onChange,
  onClose,
}) {
  if (!element) {
    return (
      <Box padding="400">
        <Text as="p" tone="subdued">
          Select an element in the preview to edit its settings.
        </Text>
      </Box>
    );
  }

  const type = String(element.type || "text")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const updateSetting = (key, value) => {
    onChange?.({
      ...element,
      [key]: value,
    });
  };

  const isTextField = [
    "text",
    "short_text",
    "first_name",
    "last_name",
    "name",
    "email",
    "phone",
    "password",
    "url",
    "number",
    "quantity",
    "textarea",
  ].includes(type);

  const isChoiceField = [
    "radio",
    "radio_button",
    "dropdown",
    "select",
    "checkboxes",
    "checkbox_group",
    "image_dropdown",
    "image_options",
  ].includes(type);

  const widthOptions = [
    { label: "33%", value: "33.33" },
    { label: "50%", value: "50" },
    { label: "100%", value: "100" },
  ];

  const normalizedWidth = String(element.columnWidth ?? 100)
    .replace("%", "");

  const options = Array.isArray(element.options)
    ? element.options
    : [];

  const updateOption = (index, key, value) => {
    const updatedOptions = options.map((option, optionIndex) => {
      if (optionIndex !== index) return option;

      const normalizedOption =
        typeof option === "string"
          ? { label: option, value: option }
          : option;

      return {
        ...normalizedOption,
        [key]: value,
        ...(key === "label" &&
          !normalizedOption.value && { value }),
      };
    });

    updateSetting("options", updatedOptions);
  };

  const addOption = () => {
    updateSetting("options", [
      ...options,
      {
        id: crypto.randomUUID(),
        label: `Option ${options.length + 1}`,
        value: `option-${options.length + 1}`,
      },
    ]);
  };

  const removeOption = (index) => {
    updateSetting(
      "options",
      options.filter((_, optionIndex) => optionIndex !== index)
    );
  };

  return (
    <Box padding="300">
      <BlockStack gap="300">
        {/* Settings header */}
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              variant="tertiary"
              onClick={onClose}
              accessibilityLabel="Back to elements"
            />
            <Text as="h2" variant="headingMd">
              {element.label || "Untitled field"}
            </Text>
          </InlineStack>

          <Tooltip content="Element settings">
            <Button
              icon={MagicIcon}
              variant="tertiary"
              accessibilityLabel="Element settings"
            />
          </Tooltip>
        </InlineStack>

        <Divider />

        {/* Common field settings */}
        <TextField
          label="Label"
          value={element.label || ""}
          onChange={(value) => updateSetting("label", value)}
          autoComplete="off"
        />

        {isTextField && (
          <>
            <TextField
              label="Placeholder"
              value={element.placeholder || ""}
              onChange={(value) =>
                updateSetting("placeholder", value)
              }
              autoComplete="off"
            />

            <TextField
              label="Description"
              value={element.description || ""}
              onChange={(value) =>
                updateSetting("description", value)
              }
              autoComplete="off"
            />

            <TextField
              label="Default value"
              value={element.defaultValue || ""}
              onChange={(value) =>
                updateSetting("defaultValue", value)
              }
              autoComplete="off"
            />

            <Checkbox
              label="Limit characters"
              checked={Boolean(element.limitCharacters)}
              onChange={(checked) =>
                updateSetting("limitCharacters", checked)
              }
            />

            {element.limitCharacters && (
              <TextField
                label="Maximum characters"
                type="number"
                value={String(element.maxCharacters ?? 100)}
                onChange={(value) =>
                  updateSetting("maxCharacters", Number(value))
                }
                autoComplete="off"
              />
            )}
          </>
        )}

        {/* Required and label settings */}
        <Checkbox
          label="Hide label"
          checked={Boolean(element.hideLabel)}
          onChange={(checked) =>
            updateSetting("hideLabel", checked)
          }
        />

        <Checkbox
          label="Required"
          checked={Boolean(element.required)}
          onChange={(checked) =>
            updateSetting("required", checked)
          }
        />

        {element.required && (
          <>
            <TextField
              label="Required error message"
              value={element.requiredMessage || ""}
              onChange={(value) =>
                updateSetting("requiredMessage", value)
              }
              autoComplete="off"
              helpText="Shown when this field is required and left empty on submit."
            />

            <Checkbox
              label="Show required note if hide label?"
              checked={Boolean(element.showRequiredNote)}
              onChange={(checked) =>
                updateSetting("showRequiredNote", checked)
              }
            />
          </>
        )}

        {/* Text validation */}
        {isTextField && (
          <>
            {["number", "quantity"].includes(type) && (
              <Checkbox
                label="Enter numbers only"
                checked={Boolean(element.numbersOnly)}
                onChange={(checked) =>
                  updateSetting("numbersOnly", checked)
                }
              />
            )}

            {["name", "first_name", "last_name"].includes(type) && (
              <Checkbox
                label="Name validation"
                checked={Boolean(element.nameValidation)}
                onChange={(checked) =>
                  updateSetting("nameValidation", checked)
                }
              />
            )}
          </>
        )}

        {/* Icon setting placeholder */}
        <BlockStack gap="150">
          <Text as="p" variant="bodyMd">
            Select icon
          </Text>

          <Box
            background="bg-surface-secondary"
            borderRadius="200"
            padding="300"
          >
            <InlineStack align="center">
              <Button
                onClick={() =>
                  updateSetting(
                    "icon",
                    element.icon ? "" : "default"
                  )
                }
              >
                {element.icon ? "Remove icon" : "Select icon"}
              </Button>
            </InlineStack>
          </Box>
        </BlockStack>

        {/* Column width */}
        <BlockStack gap="150">
          <Text as="p" variant="bodyMd">
            Column width
          </Text>

          <ButtonGroup variant="segmented" fullWidth>
            {widthOptions.map((option) => (
              <Button
                key={option.value}
                pressed={normalizedWidth === option.value}
                onClick={() =>
                  updateSetting(
                    "columnWidth",
                    Number(option.value)
                  )
                }
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </BlockStack>

        {/* Choice options */}
        {isChoiceField && (
          <>
            <Divider />

            <Text as="h3" variant="headingMd">
              Options
            </Text>

            {options.map((option, index) => {
              const optionLabel =
                typeof option === "string"
                  ? option
                  : option.label || "";

              return (
                <BlockStack key={option.id || index} gap="150">
                  <InlineStack align="space-between" blockAlign="center">
                    <Box width="100%">
                      <TextField
                        label={`Option ${index + 1}`}
                        labelHidden
                        value={optionLabel}
                        onChange={(value) =>
                          updateOption(index, "label", value)
                        }
                        autoComplete="off"
                      />
                    </Box>

                    <Button
                      variant="tertiary"
                      tone="critical"
                      onClick={() => removeOption(index)}
                      accessibilityLabel={`Remove option ${index + 1}`}
                    >
                      Remove
                    </Button>
                  </InlineStack>
                </BlockStack>
              );
            })}

            <Button onClick={addOption}>
              Add option
            </Button>
          </>
        )}

        {/* Visibility */}
        <Divider />

        <Checkbox
          label="Conditional display"
          checked={Boolean(element.conditionalDisplay)}
          onChange={(checked) =>
            updateSetting("conditionalDisplay", checked)
          }
        />

        <Button onClick={onClose} fullWidth>
          Back to elements
        </Button>
      </BlockStack>
    </Box>
  );
}
