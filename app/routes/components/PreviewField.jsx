
import React, { useEffect, useState } from "react";
import * as PolarisIcons from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";
import DOMPurify from "dompurify";
import ReactCountryFlag from "react-country-flag";
import {
  Text,
  Divider,
  TextField,
  Checkbox,
  Select,
  InlineStack,
  ChoiceList,
  DropZone,
  Button,
  BlockStack,
} from "@shopify/polaris";
import { countries } from "../components/elementsettings/utils/countries.js";

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
  const placeholder = normalizedElement.placeholder || label;
  const defaultValue = normalizedElement.defaultValue ?? "";
  const required = Boolean(normalizedElement.required);

  //if icon is selected
  const selectedIcon = normalizedElement.selectIcon
    ? PolarisIcons[normalizedElement.selectIcon]
    : null;

  const fieldLabelWithIcon = !hideLabel && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "6px",
      }}
    >
      {selectedIcon && <Icon source={selectedIcon} />}
      <Text as="label" variant="bodyMd">
        {label}
      </Text>
      {required && (
        <span style={{ color: "var(--p-color-text-critical)" }}>
          *
        </span>
      )}
    </div>
  );

  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState([]);
  const [value, setValue] = useState(defaultValue);
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [dateValue, setDateValue] = useState(defaultValue);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [rangeValue, setRangeValue] = useState(50);
  const [colorValue, setColorValue] = useState("#563D7C");
  const [rating, setRating] = useState(0);

  // Apply a changed default value when the element settings change.
  useEffect(() => {
    setValue(normalizedElement.defaultValue ?? "");
    setDateValue(normalizedElement.defaultValue ?? "");
     setConfirmPasswordValue("")
  }, [normalizedElement.id, normalizedElement.defaultValue]);

  useEffect(() => {
    setChecked(Boolean(normalizedElement.defaultValue));
  }, [normalizedElement.id, normalizedElement.defaultValue]);

  const rawOptions = normalizedElement.options || [];

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
    label: fieldLabelWithIcon,
    labelHidden: hideLabel,
    placeholder: placeholder || undefined,
    helpText: description || undefined,
    requiredIndicator: required,
    autoComplete: "off",
  };

  const commonSelectProps = {
    label: fieldLabelWithIcon,
    labelHidden: hideLabel,
    helpText: description || undefined,
    requiredIndicator: required,
  };

  const descriptionText = description ? (
    <Text as="p" variant="bodySm" tone="subdued">
      {description}
    </Text>
  ) : null;

  //get country from the country.js get the selected value 
  const selectedCountry = countries.find(
    (country) =>
      country.value === normalizedElement.defaultCountryCode
  );

  //options per line for radio and checkbox
  const optionsPerLine = Math.min(
    5,
    Math.max(1, Number(normalizedElement.optionsPerLine) || 1)
  );
  // to show option per line
  const choiceGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${optionsPerLine}, minmax(0, 1fr))`,
    gap: "12px",
    width: "100%",
  };

  switch (type) {
    case "email":
      return (
        <TextField
          {...commonTextFieldProps}
          type="email"
          autoComplete="email"
          value={value}
          onChange={setValue}
          readOnly
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
        <BlockStack gap="200">
          {!hideLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "fit-content",
              }}
            >
              {selectedCountry && (
                <>
                  <ReactCountryFlag
                    countryCode={selectedCountry.value.toUpperCase()}
                    svg
                    style={{
                      width: "20px",
                      height: "15px",
                      objectFit: "cover",
                    }}
                  />

                  <span>{selectedCountry.dialCode}</span>
                </>
              )}

              <span>{label}</span>
            </div>
          )}

          <TextField
            type="tel"
            labelHidden
            placeholder={placeholder || label}
            value={value}
            onChange={setValue}
            readOnly
          />
        </BlockStack>
      );

case "password":
    return (
        <BlockStack gap="300">

            {/* Original Password Field */}
            <TextField
                {...commonTextFieldProps}
                type="password"
                autoComplete="new-password"
                value={value}
                onChange={setValue}
                readOnly
            />

            {/* Confirm Password Field */}
            {normalizedElement.confirmPassword && (
                <TextField
                    type="password"
                    label={
                        normalizedElement.confirmPasswordLabel ||
                        "Confirm Password"
                    }
                    placeholder={
                        normalizedElement.confirmPasswordPlaceholder ||
                        "Confirm your password"
                    }
                    helpText={
                        normalizedElement.confirmPasswordDescription ||
                        undefined
                    }
                    value={confirmPasswordValue}
                    onChange={setConfirmPasswordValue}
                    autoComplete="new-password"
                    readOnly
                />
            )}

        </BlockStack>
    );

    case "country": {
      const selectedCountries = Array.isArray(normalizedElement.defaultValue)
        ? normalizedElement.defaultValue
        : normalizedElement.defaultValue
          ? [normalizedElement.defaultValue]
          : [];

      const selectedCountryDetails = countries.filter((country) =>
        selectedCountries.includes(country.value)
      );

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <BlockStack gap="200">
            {selectedCountryDetails.length > 0 ? (
              selectedCountryDetails.map((country) => (
                <InlineStack
                  key={country.value}
                  gap="200"
                  blockAlign="center"
                >
                  {normalizedElement.showFlags && (
                    <ReactCountryFlag
                      countryCode={country.value.toUpperCase()}
                      svg
                      style={{
                        width: "20px",
                        height: "15px",
                      }}
                    />
                  )}

                  <Text>{country.name}</Text>
                </InlineStack>
              ))
            ) : (
              <TextField
                label=""
                labelHidden
                value=""
                placeholder={
                  normalizedElement.placeholder || "Select a country"
                }
                disabled
                autoComplete="off"
              />
            )}
          </BlockStack>

          {descriptionText}
        </BlockStack>
      );
    }

    case "dropdown":
    case "select":
    case "image_dropdown":
      return (
        <Select
          {...commonSelectProps}
          options={[
            { label: "Dropdown", value: "" },
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
          {fieldLabelWithIcon}

          <div style={choiceGridStyle}>
            {options.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={selected.includes(option.value)}
                onChange={(isChecked) => {
                  setSelected((previous) =>
                    isChecked
                      ? [...previous, option.value]
                      : previous.filter(
                        (value) => value !== option.value
                      )
                  );
                }}
              />
            ))}
          </div>

          {descriptionText}
        </BlockStack>
      );

    case "radio":
    case "radio_button":
    case "radio_group":
    case "feedback":
    case "matrix":
    case "rating_level":
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={choiceGridStyle}>
            {options.map((option) => (
              <label
                key={option.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name={`radio-${normalizedElement.id}`}
                  value={option.value}
                  checked={selected[0] === option.value}
                  onChange={() => setSelected([option.value])}
                />

                <span>{option.label}</span>
              </label>
            ))}
          </div>

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

    case "heading": {
      const headingConfig = {
        h1: { tag: "h1", variant: "heading2xl" },
        h2: { tag: "h2", variant: "headingXl" },
        h3: { tag: "h3", variant: "headingLg" },
        h4: { tag: "h4", variant: "headingMd" },
        h5: { tag: "h5", variant: "headingSm" },
        h6: { tag: "h6", variant: "headingXs" },
      };

      const config = headingConfig[element.headingTag] || headingConfig.h2;

      return (
        <BlockStack gap="200">
          <Text as={config.tag} variant={config.variant}>
            {element.content || "Heading"}
          </Text>

          {element.description && (
            <Text as="p" variant="bodyMd">
              {element.description}
            </Text>
          )}
        </BlockStack>
      );
    }

    case "paragraph":
    case "html":
      return (
        <BlockStack gap="200">
          <div
            className="rich-text-preview"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                normalizedElement.content || `<p>${label}</p>`
              ),
            }}
          />
          {descriptionText}
        </BlockStack>
      );
    // i use custom css here to style the divder preview
    case "divider":
      return (
        <hr
          style={{
            border: "none",
            borderTop: `2px ${element.dividerStyle || "solid"} ${element.dividerColor || "currentColor"
              }`,
            display: element.hideDivider ? "none" : "block",
            width: "100%",
            margin: 0,
          }}
        />
      );

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
          {fieldLabelWithIcon}

          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
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
          readOnly
        />
      );
  }
}
