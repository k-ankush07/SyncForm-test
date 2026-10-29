
import React, { useEffect, useState } from "react";

import {
  Text,
  Divider,
  TextField,
  Checkbox,
  Select,
  ChoiceList,
  DropZone,
  Button,
  BlockStack,
} from "@shopify/polaris";

export default function PreviewField({ element, field }) {
  const currentElement = element ?? field;

  const normalizedElement =
    typeof currentElement === "string"
      ? {
          type: currentElement
            .toLowerCase()
            .trim()
            .replace(/[\s-]+/g, "_"),
          label: currentElement,
        }
      : currentElement ?? {};

  const type = normalizedElement.type
    ?.toLowerCase()
    .replace(/[\s-]+/g, "_");

  const label =
    normalizedElement.label ||
    normalizedElement.name ||
    "Untitled field";

  const hideLabel = Boolean(normalizedElement.hideLabel);
  const description = normalizedElement.description || "";
  const placeholder = normalizedElement.placeholder || "";
  const defaultValue = normalizedElement.defaultValue ?? "";
  const required = Boolean(normalizedElement.required);

  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState([]);
  const [value, setValue] = useState(defaultValue);
  const [dateValue, setDateValue] = useState(defaultValue);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [rangeValue, setRangeValue] = useState(50);
  const [colorValue, setColorValue] = useState("#563D7C");
  const [rating, setRating] = useState(0);

  // Apply a changed default value when the element settings change.
  useEffect(() => {
    setValue(normalizedElement.defaultValue ?? "");
    setDateValue(normalizedElement.defaultValue ?? "");
  }, [normalizedElement.id, normalizedElement.defaultValue]);

  useEffect(() => {
    setChecked(Boolean(normalizedElement.defaultValue));
  }, [normalizedElement.id, normalizedElement.defaultValue]);

  const rawOptions = normalizedElement.options?.length
    ? normalizedElement.options
    : [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ];

  const options = rawOptions.map((option, index) => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }

    return {
      label: option.label || option.value || `Option ${index + 1}`,
      value: option.value || option.label || `option-${index + 1}`,
    };
  });

  if (!currentElement) return null;

  const fieldLabel = hideLabel ? "" : label;

  const commonTextFieldProps = {
    label: fieldLabel,
    labelHidden: hideLabel,
    placeholder: placeholder || undefined,
    helpText: description || undefined,
    requiredIndicator: required,
    autoComplete: "off",
  };

  const commonSelectProps = {
    label: fieldLabel,
    labelHidden: hideLabel,
    helpText: description || undefined,
    requiredIndicator: required,
  };

  const descriptionText = description ? (
    <Text as="p" variant="bodySm" tone="subdued">
      {description}
    </Text>
  ) : null;

  switch (type) {
    case "email":
      return (
        <TextField
          {...commonTextFieldProps}
          type="email"
          autoComplete="email"
          value={value}
          onChange={setValue}
        />
      );

    case "name":
    case "first_name":
      return (
        <TextField
          {...commonTextFieldProps}
          autoComplete="given-name"
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "last_name":
      return (
        <TextField
          {...commonTextFieldProps}
          autoComplete="family-name"
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "phone":
      return (
        <TextField
          {...commonTextFieldProps}
          type="tel"
          autoComplete="tel"
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "password":
      return (
        <TextField
          {...commonTextFieldProps}
          type="password"
          autoComplete="new-password"
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "country":
      return (
        <Select
          {...commonSelectProps}
          options={[
            { label: "Select country", value: "" },
            { label: "India", value: "IN" },
            { label: "United States", value: "US" },
            { label: "United Kingdom", value: "GB" },
          ]}
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "dropdown":
    case "select":
    case "image_dropdown":
      return (
        <Select
          {...commonSelectProps}
          options={[
            { label: "Choose an option", value: "" },
            ...options,
          ]}
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "checkboxes":
    case "checkbox_group":
    case "image_options":
      return (
        <BlockStack gap="200">
          <ChoiceList
            title={fieldLabel || label}
            allowMultiple
            choices={options}
            selected={selected}
            onChange={setSelected}
            readOnly
          />
          {descriptionText}
        </BlockStack>
      );

    case "radio":
    case "radio_button":
    case "feedback":
    case "matrix":
    case "rating_level":
      return (
        <BlockStack gap="200">
          <ChoiceList
            title={fieldLabel || label}
            choices={options}
            selected={selected}
            onChange={setSelected}
            readOnly
          />
          {descriptionText}
        </BlockStack>
      );

    case "consent":
    case "checkbox":
    case "switch":
      return (
        <BlockStack gap="200">
          <Checkbox
            label={fieldLabel || label}
            checked={checked}
            onChange={setChecked}
            readOnly
          />
          {descriptionText}
        </BlockStack>
      );

    case "button":
      return <Button>{label}</Button>;

    case "product":
      return (
        <TextField
          {...commonTextFieldProps}
          placeholder={placeholder || "Search products"}
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "url":
      return (
        <TextField
          {...commonTextFieldProps}
          type="url"
          placeholder={placeholder || "https://example.com"}
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "date":
      return (
        <TextField
          {...commonTextFieldProps}
          type="date"
          value={dateValue}
          onChange={setDateValue}
          readOnly
        />
      );

    case "hidden":
      return null;

    case "repeater":
      return (
        <TextField
          {...commonTextFieldProps}
          placeholder={placeholder || "Repeater preview"}
          value={value}
          onChange={setValue}
        />
      );

    case "signature":
      return (
        <BlockStack gap="200">
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label}
            </Text>
          )}
          <div
            style={{
              border: "1px dashed #8c9196",
              borderRadius: "8px",
              padding: "28px",
              textAlign: "center",
            }}
          >
            <Text as="p" variant="bodySm" tone="subdued">
              Signature area
            </Text>
          </div>
          {descriptionText}
        </BlockStack>
      );

    case "heading":
      return (
        <Text as="h2" variant="headingMd">
          {label}
        </Text>
      );

    case "paragraph":
    case "html":
      return (
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd">
            {normalizedElement.content || label}
          </Text>
          {descriptionText}
        </BlockStack>
      );

    case "divider":
      return <Divider />;

    case "text":
    case "short_text":
      return (
        <TextField
          {...commonTextFieldProps}
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "textarea":
      return (
        <TextField
          {...commonTextFieldProps}
          multiline={3}
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "number":
    case "quantity":
      return (
        <TextField
          {...commonTextFieldProps}
          type="number"
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "rating_star":
      return (
        <BlockStack gap="200">
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label}
            </Text>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} stars`}
                onClick={() => setRating(star)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "26px",
                  color: star <= rating ? "#F5A623" : "#C9CCCF",
                  padding: 0,
                }}
              >
                ★
              </button>
            ))}
          </div>
          {descriptionText}
        </BlockStack>
      );

    case "file_upload":
      return (
        <BlockStack gap="200">
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label}
            </Text>
          )}
          <DropZone
            allowMultiple={false}
            onDrop={(files) => setUploadedFiles(files)}
          >
            {uploadedFiles.length > 0 ? (
              <Text as="p" variant="bodyMd">
                {uploadedFiles[0].name}
              </Text>
            ) : (
              <DropZone.FileUpload
                actionTitle={placeholder || "Add file"}
                actionHint="or drop a file to upload"
              />
            )}
          </DropZone>
          {descriptionText}
        </BlockStack>
      );

    case "color_swatch":
      return (
        <BlockStack gap="200">
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label}
            </Text>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {["#E53935", "#1E88E5", "#43A047", "#FDD835"].map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                onClick={() => setColorValue(color)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: color,
                  border:
                    colorValue === color
                      ? "3px solid #202223"
                      : "1px solid #d2d5d8",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          {descriptionText}
        </BlockStack>
      );

    case "color_picker":
      return (
        <BlockStack gap="200">
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label}
            </Text>
          )}
          <input
            type="color"
            value={colorValue}
            onChange={(event) => setColorValue(event.target.value)}
          />
          {descriptionText}
        </BlockStack>
      );

    case "range_slider":
      return (
        <BlockStack gap="200">
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label}
            </Text>
          )}
          <input
            type="range"
            min="0"
            max="100"
            value={rangeValue}
            onChange={(event) =>
              setRangeValue(Number(event.target.value))
            }
            style={{ width: "100%" }}
          />
          <Text as="p" variant="bodySm">
            {rangeValue}
          </Text>
          {descriptionText}
        </BlockStack>
      );

    default:
      return (
        <TextField
          {...commonTextFieldProps}
          value={value}
          onChange={setValue}
        />
      );
  }
}
