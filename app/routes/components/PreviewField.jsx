
import React, { useEffect, useState } from "react";

import * as PolarisIcons from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";
import createDOMPurify from "dompurify";
import ReactCountryFlag from "react-country-flag";

import ColorInput from "../components/RichTextEditor/ColorInput.jsx"
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
import FormProgressIndicator from './RichTextEditor/FormProgressIndicator';

export default function PreviewField({ element, field, pages = [], activePageId = null, products = [],
  productsLoading = false, }) {
  const currentElement = element ?? field;
  // console.log("PreviewField received:", currentElement);
  // console.log("PreviewField type:", currentElement?.type);
  console.log(pages)
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
  // const [dateValue, setDateValue] = useState(defaultValue);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState("");
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




  //for date and time
  const [dateValue, setDateValue] = useState(
    normalizedElement.defaultDate || ""
  );

  React.useEffect(() => {
    setDateValue(normalizedElement.defaultDate || "");
  }, [normalizedElement.defaultDate]);


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

  const sanitizeHTML = (html) => {
    if (typeof window === "undefined") {
      return html;
    }

    const purifier = createDOMPurify(window);

    return purifier.sanitize(html);
  };



  //cases to render duff inputs
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
        <BlockStack gap="400">
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
    case "rating_level": {
      const maxLevel = Math.min(10, Math.max(2, Number(normalizedElement.maxLevel) || 5));

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Array.from({ length: maxLevel }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: "1px solid #8c9196",
                  background: n <= rating ? "#303030" : "#fff",
                  color: n <= rating ? "#fff" : "#303030",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <InlineStack align="space-between">
            <Text as="span" variant="bodySm" tone="subdued">
              {normalizedElement.lowLabel || "Low"}
            </Text>
            <Text as="span" variant="bodySm" tone="subdued">
              {normalizedElement.highLabel || "High"}
            </Text>
          </InlineStack>
          {descriptionText}
        </BlockStack>
      );
    }

    case "checkbox":
    case "checkboxes":
    case "checkbox_group":
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={choiceGridStyle}>
            {options.map((option, index) => (
              <Checkbox
                key={`${option.value}-${index}`}
                label={option.label}
                checked={selected.includes(option.value)}
                onChange={(isChecked) => {
                  setSelected((previous) =>
                    isChecked
                      ? [...previous, option.value]
                      : previous.filter(
                        (selectedValue) =>
                          selectedValue !== option.value
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

    case "checkbox":
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
      return (
        <InlineStack gap="200" align="center">
          {(normalizedElement.options || []).map((option) => (
            <Button key={option.id}>
              {option.label}
            </Button>
          ))}
        </InlineStack>
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
          value={dateValue}
          onChange={setDateValue}
          readOnly
        />
      );


    case "repeater":
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}
          <InlineStack gap="200" blockAlign="end" wrap={false}>
            <div style={{ flex: 1 }}>
              <TextField
                label=""
                labelHidden
                placeholder={placeholder || "Repeater preview"}
                value={value}
                onChange={setValue}
                autoComplete="off"
              />
            </div>
            <Button icon={PolarisIcons.DeleteIcon} accessibilityLabel="Remove" />
          </InlineStack>
          <div>
            <Button icon={PolarisIcons.PlusIcon}>
              {normalizedElement.addButtonText || "Add more"}
            </Button>
          </div>
          {descriptionText}
        </BlockStack>
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
      return (
        <BlockStack gap="200">
          <div
            className="rich-text-preview"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(
                normalizedElement.content || `<p>${label}</p>`
              ),
            }}
          />
          {descriptionText}
        </BlockStack>
      );
    case "html":
      return (
        <BlockStack gap="200">
          {!hideLabel && fieldLabelWithIcon}
          {normalizedElement.customCode?.trim() ? (
            <div
              className="rich-text-preview"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(normalizedElement.customCode),
              }}
            />
          ) : (
            <div
              style={{
                border: "1px dashed #8c9196",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <Text as="p" variant="bodySm" tone="subdued">
                Custom HTML (add code in settings)
              </Text>
            </div>
          )}
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
      return (
        <TextField
          {...commonTextFieldProps}
          type="number"
          value={value}
          onChange={setValue}
          readOnly
        />
      );

    case "quantity": {
      const min = normalizedElement.setMinValue
        ? Number(normalizedElement.minValue || 0)
        : 0;

      const max = normalizedElement.setMaxValue &&
        normalizedElement.maxValue !== ""
        ? Number(normalizedElement.maxValue)
        : Infinity;

      // Start from minimum value
      const currentValue =
        value === "" || value === undefined || value === null
          ? min
          : Number(value);

      // Keep value within min and max
      const safeValue = Math.min(max, Math.max(min, currentValue));

      const decreaseValue = () => {
        setValue(String(Math.max(min, safeValue - 1)));
      };

      const increaseValue = () => {
        setValue(String(Math.min(max, safeValue + 1)));
      };

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            minHeight: "54px",
            padding: "0 14px",
            background: "#eeeeee",
            borderRadius: "9px",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            disabled={safeValue <= min}
            onClick={decreaseValue}
            style={{
              border: "none",
              background: "transparent",
              color: safeValue <= min ? "#C9CCCF" : "#555",
              fontSize: "20px",
              cursor: safeValue <= min ? "not-allowed" : "pointer",
            }}
          >
            −
          </button>

          <span
            style={{
              flex: 1,
              marginLeft: "12px",
              fontSize: "14px",
              color: "#303030",
            }}
          >
            {commonTextFieldProps.label || "Quantity"}
          </span>

          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#303030",
              marginRight: "12px",
            }}
          >
            {safeValue}
          </span>

          <button
            type="button"
            disabled={safeValue >= max}
            onClick={increaseValue}
            style={{
              border: "none",
              background: "transparent",
              color: safeValue >= max ? "#C9CCCF" : "#555",
              fontSize: "20px",
              cursor: safeValue >= max ? "not-allowed" : "pointer",
            }}
          >
            +
          </button>
        </div>
      );
    }

    case "rating_star": {
      const customRatingIcon =
        normalizedElement.useCustomRatingIcon &&
          normalizedElement.ratingIcon
          ? PolarisIcons[normalizedElement.ratingIcon]
          : null;

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "30px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    transform: "scale(2.3)", transformOrigin: "center",
                    color: star <= rating ? "#F5A623" : "#C9CCCF",
                  }}
                >
                  {customRatingIcon ? (
                    <span
                      style={{
                        display: "flex",
                        width: "80px",
                        height: "80px",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon source={customRatingIcon} />
                    </span>
                  ) : (
                    <span style={{
                      display: "flex",
                      width: "68px",
                      height: "68px",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>★</span>
                  )}
                </button>

                {normalizedElement.showNumberUnderIcon && (
                  <span style={{ fontSize: "14px", color: "#6D7175" }}>
                    {star}
                  </span>
                )}
              </div>
            ))}
          </div>

          {descriptionText}
        </BlockStack>
      );
    }

    case "file_upload": {
      const buttonText = normalizedElement.buttonText || "Browse file";

      const placeholder =
        normalizedElement.placeholder || "Choose file or drag here";

      const hint = normalizedElement.hint || "PNG, GIF, SVG.";

      const acceptedFileTypes = Array.isArray(
        normalizedElement.acceptedFileTypes
      )
        ? normalizedElement.acceptedFileTypes
        : [];



      return (
        <BlockStack gap="200">
          {/* Field label */}
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label || "Attachments"}
              {required && (
                <span style={{ color: "var(--p-color-text-critical)" }}>
                  {" "}*
                </span>
              )}
            </Text>
          )}

          {/* Upload preview */}
          <div
            style={{
              width: "100%",
              minHeight: "150px",
              background: "#eeeeee",
              border: "1px dashed #8c9196",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            {/* Placeholder */}
            <Text as="p" variant="bodyMd">
              {placeholder}
            </Text>

            {/* Hint */}
            <Text as="p" variant="bodySm" tone="subdued">
              {acceptedFileTypes.length > 0
                ? `Supported formats: ${acceptedFileTypes.join(", ").toUpperCase()}`
                : hint}
            </Text>

            {/* Browse button */}
            <div
              style={{
                padding: "7px 14px",
                border: "1px solid #8c9196",
                borderRadius: "5px",
                color: "#303030",
                fontSize: "14px",
                background: "#ffffff",
              }}
            >
              {buttonText}
            </div>


          </div>

          {/* Description */}
          {descriptionText}
        </BlockStack>
      );
    }

    case "image_options": {
      return (
        <BlockStack gap="200">
          {/* Field label */}
          {!hideLabel && (
            <Text as="p" variant="bodyMd">
              {label}
              {required && (
                <span style={{ color: "var(--p-color-text-critical)" }}>
                  {" "}*
                </span>
              )}
            </Text>
          )}

          {/* Image upload */}
          <div
            style={{
              width: "100%",
              minHeight: "150px",
              background: "#eeeeee",
              border: "1px dashed #8c9196",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Selected image preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "180px",
                  objectFit: "contain",
                  borderRadius: "6px",
                }}
              />
            ) : (
              <Text as="p" variant="bodyMd">
                {normalizedElement.placeholder || "Choose an image"}
              </Text>
            )}

            <label
              style={{
                padding: "7px 14px",
                border: "1px solid #8c9196",
                borderRadius: "5px",
                color: "#303030",
                fontSize: "14px",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              {imagePreview ? "Change image" : "Browse image"}

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file && file.type.startsWith("image/")) {
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>

          {/* Description */}
          {descriptionText}
        </BlockStack>
      );
    }

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
          <ColorInput
            label={hideLabel ? "" : label}
            value={colorValue}
            onChange={setColorValue}
          />

          {descriptionText}
        </BlockStack>
      );


    case "form_header": {
      const headingConfig = {
        h1: { tag: "h1", fontSize: 36 },
        h2: { tag: "h2", fontSize: 30 },
        h3: { tag: "h3", fontSize: 24 },
        h4: { tag: "h4", fontSize: 20 },
        h5: { tag: "h5", fontSize: 18 },
        h6: { tag: "h6", fontSize: 16 },
      };

      const headingTag = String(
        normalizedElement.headingTag || "h2"
      ).toLowerCase();

      const config = headingConfig[headingTag] || headingConfig.h2;
      const HeadingTag = config.tag;

      return (
        <div
          style={{
            width: "100%",
            textAlign: normalizedElement.alignment || "left",
          }}
        >
          {normalizedElement.showHeader !== false && (
            <HeadingTag
              style={{
                margin: 0,
                color: normalizedElement.headingColor || "inherit",

                // Use selected tag's font size
                fontSize: `${config.fontSize}px`,

                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {normalizedElement.title || "Contact us"}
            </HeadingTag>
          )}

          {normalizedElement.description && (
            <div
              className="rich-text-preview"
              style={{
                marginTop: normalizedElement.showHeader !== false
                  ? "8px"
                  : 0,
              }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(normalizedElement.description),
              }}
            />
          )}
          <FormProgressIndicator
            pages={pages}
            activePageId={activePageId}
          />
        </div>
      );
    }
    case "hidden":
      return (
        <div
          style={{
            border: "1px dashed #8c9196",
            borderRadius: "8px",
            padding: "10px 24px",
            background: "#f7f7f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >

          <Text as="span" variant="bodySm" tone="subdued">
            {value || "Hidden field"}
          </Text>
        </div>
      );


    case "form_footer":
      return (
        <BlockStack gap="300">
          {/* Footer text */}
          {normalizedElement.text && (
            <Text as="p">{normalizedElement.text}</Text>
          )}

          {/* Rich text content */}
          {normalizedElement.content && (
            <div
              className="rich-text-preview"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(normalizedElement.content),
              }}
            />
          )}

          {/* Description at the bottom */}
          {normalizedElement.showDescriptionAtBottom &&
            normalizedElement.bottomDescription && (
              <Text as="p" variant="bodySm" tone="subdued">
                {normalizedElement.bottomDescription}
              </Text>
            )}

          {/* Footer buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: normalizedElement.fullWidthButton
                ? "column"
                : "row",
              alignItems: normalizedElement.fullWidthButton
                ? "stretch"
                : "center",
              justifyContent: normalizedElement.fullWidthButton
                ? "flex-start"
                : normalizedElement.buttonAlignment === "center"
                  ? "center"
                  : normalizedElement.buttonAlignment === "right"
                    ? "flex-end"
                    : "flex-start",
              flexWrap: "wrap",
              gap: "8px",
              width: "100%",
            }}
          >
            {/* Previous button */}
            {normalizedElement.showPreviousButton && (
              <div
                style={{
                  width: normalizedElement.fullWidthButton ? "100%" : "auto",
                }}
              >
                <Button fullWidth={Boolean(normalizedElement.fullWidthButton)}>
                  {normalizedElement.previousText || "Previous"}
                </Button>
              </div>
            )}

            {/* Next button */}
            {normalizedElement.showNextButton && (
              <div
                style={{
                  width: normalizedElement.fullWidthButton ? "100%" : "auto",
                }}
              >
                <Button fullWidth={Boolean(normalizedElement.fullWidthButton)}>
                  {normalizedElement.nextText || "Next"}
                </Button>
              </div>
            )}

            {/* Reset button */}
            {normalizedElement.showResetButton && (
              <div
                style={{
                  width: normalizedElement.fullWidthButton ? "100%" : "auto",
                }}
              >
                <Button fullWidth={Boolean(normalizedElement.fullWidthButton)}>
                  {normalizedElement.resetButtonText || "Reset"}
                </Button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              style={{
                width: normalizedElement.fullWidthButton ? "100%" : "auto",
                backgroundColor:
                  normalizedElement.buttonBackgroundColor || "#303030",
                color: normalizedElement.buttonTextColor || "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {normalizedElement.submitText || "Submit"}
            </button>
          </div>
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

    case "matrix": {
      const toLabel = (x, i, p) =>
        typeof x === "string" ? x : x?.label || x?.value || `${p} ${i + 1}`;

      const matrixRows = (
        normalizedElement.rows?.length ? normalizedElement.rows : ["Row 1", "Row 2"]
      ).map((r, i) => toLabel(r, i, "Row"));

      const matrixCols = (
        normalizedElement.columns?.length
          ? normalizedElement.columns
          : options.length
            ? options
            : ["Poor", "Good", "Great"]
      ).map((c, i) => toLabel(c, i, "Column"));

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th />
                  {matrixCols.map((c) => (
                    <th key={c} style={{ padding: "6px", fontWeight: 500 }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((r) => (
                  <tr key={r} style={{ borderTop: "1px solid #e1e3e5" }}>
                    <td style={{ padding: "8px 6px" }}>{r}</td>
                    {matrixCols.map((c) => (
                      <td key={c} style={{ textAlign: "center" }}>
                        <input
                          type="radio"
                          name={`matrix-${normalizedElement.id}-${r}`}
                          checked={selected.includes(`${r}::${c}`)}
                          onChange={() =>
                            setSelected((prev) => [
                              ...prev.filter((v) => !v.startsWith(`${r}::`)),
                              `${r}::${c}`,
                            ])
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {descriptionText}
        </BlockStack>
      );
    }
    case "feedback": {
      const emojis = ["😡", "🙁", "😐", "🙂", "😍"];
      const items = options.length > 0 ? options : emojis.map((e) => ({ label: e, value: e }));

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}
          <div style={{ display: "flex", gap: "12px" }}>
            {items.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelected([item.value])}
                style={{
                  fontSize: "26px",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  border:
                    selected[0] === item.value
                      ? "2px solid #303030"
                      : "1px solid transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {descriptionText}
        </BlockStack>
      );
    }
    case "switch":
      return (
        <BlockStack gap="200">
          <InlineStack gap="300" blockAlign="center">
            <button
              type="button"
              role="switch"
              aria-checked={checked}
              onClick={() => setChecked((prev) => !prev)}
              style={{
                width: "42px",
                height: "24px",
                minWidth: "42px",
                borderRadius: "20px",
                border: "none",
                padding: "3px",
                cursor: "pointer",
                backgroundColor: checked ? "#008060" : "#8C9196",
                display: "flex",
                alignItems: "center",
                justifyContent: checked ? "flex-end" : "flex-start",
                transition: "background-color 0.2s ease",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {fieldLabelWithIcon}
          </InlineStack>

          {descriptionText}
        </BlockStack>
      );

    case "image_dropdown": {
      const imageOptions = rawOptions.filter(
        (opt) => typeof opt === "object" && opt?.image
      );

      return (
        <BlockStack gap="200">
          <Select
            {...commonSelectProps}
            options={[{ label: "Select an option", value: "" }, ...options]}
            value={value}
            onChange={setValue}
            readOnly
          />
          {imageOptions.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {imageOptions.map((opt, i) => (
                <img
                  key={opt.value || i}
                  src={opt.image}
                  alt={opt.label || ""}
                  onClick={() => setValue(opt.value || opt.label)}
                  style={{
                    width: "44px",
                    height: "44px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border:
                      value === (opt.value || opt.label)
                        ? "2px solid #303030"
                        : "1px solid #d2d5d8",
                  }}
                />
              ))}
            </div>
          )}
        </BlockStack>
      );
    }

    case "product": {
      // Products received from LivePreview props
      const selectedProductIds = Array.isArray(
        normalizedElement.selectedProductIds
      )
        ? normalizedElement.selectedProductIds
        : [];

      // Only display products selected in Product Settings
      const selectedProducts = products.filter((product) =>
        selectedProductIds.includes(product.id)
      );

      const isList = normalizedElement.productLayout === "list";
      const showSearch = normalizedElement.showSearchBar !== false;

      // Apply search only when the search bar is enabled
      const filteredProducts = showSearch
        ? selectedProducts.filter((product) =>
          (product.title || "")
            .toLowerCase()
            .includes((value || "").toLowerCase())
        )
        : selectedProducts;

      return (
        <BlockStack gap="300">
          {fieldLabelWithIcon}

          {/* SEARCH BAR */}
          {showSearch && (
            <TextField
              placeholder={
                normalizedElement.placeholder || "Search products"
              }
              prefix={<Icon source={PolarisIcons.SearchIcon} />}
              value={value}
              onChange={setValue}
              autoComplete="off"
            />
          )}

          {/* LOADING */}
          {productsLoading && (
            <Text as="p" tone="subdued" variant="bodySm">
              Loading Shopify products...
            </Text>
          )}

          {/* PRODUCT DISPLAY */}
          {!productsLoading && (
            <>
              {selectedProductIds.length === 0 ? (
                <Text as="p" tone="subdued" variant="bodySm">
                  No products selected. Select products in Product Settings.
                </Text>
              ) : filteredProducts.length === 0 ? (
                <Text as="p" tone="subdued" variant="bodySm">
                  No matching products found.
                </Text>
              ) : (
                <div
                  style={{
                    display: isList ? "flex" : "grid",
                    flexDirection: isList ? "column" : undefined,
                    gridTemplateColumns: isList
                      ? undefined
                      : "repeat(3, minmax(0, 1fr))",
                    gap: "12px",
                    width: "100%",
                  }}
                >
                  {filteredProducts.map((product) => {
                    const isSelected = selected.includes(product.id);

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (normalizedElement.allowMultiple) {
                            setSelected((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== product.id)
                                : [...prev, product.id]
                            );
                          } else {
                            setSelected(isSelected ? [] : [product.id]);
                          }
                        }}
                        style={{
                          display: isList ? "flex" : "block",
                          flexDirection: isList ? "row" : undefined,
                          alignItems: isList ? "center" : undefined,
                          gap: "12px",
                          border: isSelected
                            ? "2px solid #008060"
                            : "1px solid #e1e3e5",
                          borderRadius: "8px",
                          overflow: "hidden",
                          cursor: "pointer",
                          background: "#fff",
                          padding: isList ? "8px" : "0",
                          minWidth: 0,
                        }}
                      >
                        {/* PRODUCT IMAGE */}
                        {normalizedElement.showProductImage !== false && (
                          <div
                            style={{
                              width: isList ? "90px" : "100%",
                              minWidth: isList ? "90px" : undefined,
                              height: isList ? "90px" : "110px",
                              background: "#f4f5f6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.imageAlt || product.title}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <Icon
                                source={PolarisIcons.ImageIcon}
                                tone="subdued"
                              />
                            )}
                          </div>
                        )}

                        {/* PRODUCT DETAILS */}
                        <div
                          style={{
                            padding: isList ? "4px" : "10px",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Text
                            as="p"
                            variant="bodyMd"
                            fontWeight="medium"
                          >
                            {product.title}
                          </Text>

                          {product.description && (
                            <Text
                              as="p"
                              variant="bodySm"
                              tone="subdued"
                            >
                              {product.description.trim().split(/\s+/).slice(0, 10).join(" ")}
                              {product.description.trim().split(/\s+/).length > 10 ? "..." : ""}
                            </Text>
                          )}

                          {/* PRODUCT PRICE */}
                          {normalizedElement.showProductPrice !== false && (
                            <Text
                              as="p"
                              variant="bodyMd"
                              fontWeight="semibold"
                            >
                              {product.price}
                            </Text>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {descriptionText}
        </BlockStack>
      );
    }

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
