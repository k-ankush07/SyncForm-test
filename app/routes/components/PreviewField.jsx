
import React, { useEffect, useState, useRef } from "react";
import SignaturePad from "signature_pad";
import "flag-icons/css/flag-icons.min.css";
import * as PolarisIcons from "@shopify/polaris-icons";
import {
  Icon,
  Text,
  TextField,
  Checkbox,
  Select,
  InlineStack,
  Button,
  BlockStack,
} from "@shopify/polaris";

import createDOMPurify from "dompurify";

import ColorInput from "../components/RichTextEditor/ColorInput.jsx";
import { countries } from "../components/elementsettings/utils/countries.js";
import FormProgressIndicator from "./RichTextEditor/FormProgressIndicator";

import {
  isValidPhoneNumber,
} from "libphonenumber-js";

// =============================================================
// SIGNATURE PREVIEW COMPONENT
// Hooks must live inside a component, not inside a switch case.
// =============================================================

function SignaturePreview({
  element,
  label,
  hideLabel,
  required,
  descriptionText,
  isReadOnly,
}) {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

  const [uploadedSignature, setUploadedSignature] = useState(null);

  const showCanvas = element.showCanvas !== false;
  const allowFileUpload = element.allowFileUpload === true;

  const canvasHeight = Number(element.canvasHeight) || 150;
  const penColor = element.penColor || "#000000";
  const penWidth = Number(element.penWidth) || 2;

  // Initialize and configure the signature canvas.
  useEffect(() => {
    if (!showCanvas || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const signaturePad = new SignaturePad(canvas, {
      penColor,
      minWidth: penWidth,
      maxWidth: penWidth,
      backgroundColor: element.canvasBackground || "#ffffff",
    });

    signaturePadRef.current = signaturePad;

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      const data = signaturePad.isEmpty()
        ? null
        : signaturePad.toData();

      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvasHeight * ratio;

      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      signaturePad.clear();

      if (data) {
        signaturePad.fromData(data);
      }
    };

    resizeCanvas();

    // Keep canvas resolution correct when its size changes.
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resizeCanvas)
        : null;

    resizeObserver?.observe(canvas);

    return () => {
      resizeObserver?.disconnect();
      signaturePad.off();
      signaturePadRef.current = null;
    };
  }, [
    element.id,
    showCanvas,
    canvasHeight,
    penColor,
    penWidth,
    element.canvasBackground,
  ]);

  // Clear the signature drawing.
  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  // Validate and preview an uploaded signature image.
  const handleSignatureUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    setUploadedSignature((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  };

  // Release the uploaded image URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (uploadedSignature) {
        URL.revokeObjectURL(uploadedSignature);
      }
    };
  }, [uploadedSignature]);

  return (
    <BlockStack gap="200">
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

      {/* Signature drawing canvas. */}
      {showCanvas && (
        <BlockStack gap="200">
          <div
            style={{
              border: "1px dashed #8c9196",
              borderRadius: "8px",
              overflow: "hidden",
              background: element.canvasBackground || "#ffffff",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                width: "100%",
                height: `${canvasHeight}px`,
                touchAction: isReadOnly ? "auto" : "none",
                cursor: isReadOnly ? "default" : "crosshair",
                pointerEvents: isReadOnly ? "none" : "auto",
              }}
            />
          </div>

          {element.allowClear !== false && (
            <InlineStack align="end">
              <Button
                size="slim"
                onClick={clearSignature}
                disabled={isReadOnly}
              >
                Clear signature
              </Button>
            </InlineStack>
          )}
        </BlockStack>
      )}

      {/* Separator when both drawing and uploading are enabled. */}
      {showCanvas && allowFileUpload && (
        <Text as="p" variant="bodySm" tone="subdued">
          OR
        </Text>
      )}

      {/* Signature image upload. */}
      {allowFileUpload && (
        <BlockStack gap="200">
          {uploadedSignature ? (
            <BlockStack gap="200">
              <img
                src={uploadedSignature}
                alt="Uploaded signature"
                style={{
                  maxWidth: "100%",
                  maxHeight: "150px",
                  objectFit: "contain",
                  border: "1px solid #e1e3e5",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              />

              {element.allowReplace !== false && (
                <label
                  style={{
                    cursor: isReadOnly ? "default" : "pointer",
                    pointerEvents: isReadOnly ? "none" : "auto",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "7px 14px",
                      border: "1px solid #8c9196",
                      borderRadius: "6px",
                    }}
                  >
                    Replace signature
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    disabled={isReadOnly}
                    onChange={handleSignatureUpload}
                  />
                </label>
              )}
            </BlockStack>
          ) : (
            <label
              style={{
                border: "1px dashed #8c9196",
                borderRadius: "8px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                cursor: isReadOnly ? "default" : "pointer",
                pointerEvents: isReadOnly ? "none" : "auto",
              }}
            >
              <Icon source={PolarisIcons.UploadIcon} />

              <Text as="span" variant="bodyMd">
                {element.uploadButtonText || "Upload signature"}
              </Text>

              <Text as="span" variant="bodySm" tone="subdued">
                {element.acceptedFileTypes || "PNG, JPG, JPEG"}
              </Text>

              <input
                type="file"
                accept="image/png,image/jpeg"
                hidden
                disabled={isReadOnly}
                onChange={handleSignatureUpload}
              />
            </label>
          )}
        </BlockStack>
      )}

      {descriptionText}
    </BlockStack>
  );
}



// =============================================================
// MAIN PREVIEW FIELD COMPONENT
// =============================================================

export default function PreviewField({
  element,
  field,
  pages = [],
  activePageId = null,
  products = [],
  isModelPreview = false,
  productsLoading = false,
}) {
  // =========================================================
  // 1. ELEMENT DATA
  // =========================================================

  const currentElement = element ?? field;
  const isReadOnly = !isModelPreview;

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

  // =========================================================
  // 2. LABEL AND ICON
  // =========================================================

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
      <Text as="label" variant="bodyMd">
        {label}
      </Text>

      {required && (
        <span style={{ color: "var(--p-color-text-critical)" }}>*</span>
      )}
    </div>
  );

  const descriptionText = description ? (
    <Text as="p" variant="bodySm" tone="subdued">
      {description}
    </Text>
  ) : null;

  // =========================================================
  // 3. FIELD STATES
  // =========================================================

  const [value, setValue] = useState(String(defaultValue));
  const [nameError, setNameError] = useState("");
  const [numberError, setNumberError] = useState("");

  const [selected, setSelected] = useState([]);

  const [checked, setChecked] = useState(
    normalizedElement.type === "consent"
      ? normalizedElement.checkedByDefault ?? true
      : Boolean(normalizedElement.defaultValue)
  );
  //passwords
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [confirmEmailValue, setConfirmEmailValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordValidationTriggered, setPasswordValidationTriggered] =
    useState(false);

  // Phone states.
  const [phoneCountry, setPhoneCountry] = useState(
    (
      normalizedElement.defaultCountryCode &&
        normalizedElement.defaultCountryCode !== "auto"
        ? normalizedElement.defaultCountryCode
        : "in"
    ).toLowerCase()
  );

  const [phoneError, setPhoneError] = useState("");
  //country satae
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  // Country dropdown states
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  // Date and time.
  const [dateValue, setDateValue] = useState(
    normalizedElement.defaultDate || ""
  );

  // File and image previews.
  const [imagePreview, setImagePreview] = useState("");

  // Rating and range values.
  const [rating, setRating] = useState(0);
  const [rangeValue, setRangeValue] = useState(50);

  // Switch state.
  const [switchValue, setSwitchValue] = useState(
    Boolean(normalizedElement.defaultChecked)
  );

  // Color picker state.
  const [colorValue, setColorValue] = useState(
    normalizedElement.defaultColor || "#563D7C"
  );

  // =========================================================
  // 4. FIELD CHANGE HANDLERS
  // =========================================================

  // Name validation and optional numbers-only setting.
  const handleNameChange = (newValue) => {
    const input = String(newValue ?? "");

    if (normalizedElement.numbersOnly) {
      setValue(input.replace(/[^0-9]/g, ""));
      setNameError("");
      return;
    }

    setValue(input);

    if (
      normalizedElement.nameValidation !== false &&
      input
    ) {
      const validName = /^[\p{L}\p{M}\s'.-]+$/u.test(input);

      setNameError(
        validName ? "" : "Please enter a valid name."
      );

      return;
    }

    setNameError("");
  };

  // Number input: accept digits only and show an error for other characters.
  const handleNumberChange = (newValue) => {
    const input = String(newValue ?? "");

    if (input !== "" && !/^\d+$/.test(input)) {
      setValue(input);
      setNumberError("Please enter numbers only.");
      return;
    }

    setValue(input);
    setNumberError("");
  };

  // =========================================================
  // 5. EFFECTS
  // =========================================================

  // Update common input and confirmation values when the element changes.
  useEffect(() => {
    setValue(String(normalizedElement.defaultValue ?? ""));
    setDateValue(normalizedElement.defaultValue ?? "");
    setConfirmPasswordValue("");
    setPasswordValidationTriggered(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setConfirmEmailValue("");
    setNameError("");
    setNumberError("");
  }, [normalizedElement.id, normalizedElement.defaultValue]);

  // Reset phone country and value when phone settings change.
  useEffect(() => {
    const configuredCountry = normalizedElement.defaultCountryCode;

    setPhoneCountry(
      configuredCountry && configuredCountry !== "auto"
        ? configuredCountry.toLowerCase()
        : "in"
    );

    setValue(String(normalizedElement.defaultValue ?? ""));
    setPhoneError("");
    setCountryDropdownOpen(false);
  }, [
    normalizedElement.id,
    normalizedElement.defaultCountryCode,
    normalizedElement.defaultValue,
  ]);

  // Update checkbox and consent defaults.
  useEffect(() => {
    setChecked(
      normalizedElement.type === "consent"
        ? normalizedElement.checkedByDefault ?? true
        : Boolean(normalizedElement.defaultValue)
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    normalizedElement.checkedByDefault,
    normalizedElement.type,
  ]);

  // Update switch default.
  useEffect(() => {
    setSwitchValue(Boolean(normalizedElement.defaultChecked));
  }, [normalizedElement.id, normalizedElement.defaultChecked]);

  // Update color default.
  useEffect(() => {
    setColorValue(normalizedElement.defaultColor || "#563D7C");
  }, [normalizedElement.id, normalizedElement.defaultColor]);

  // Reset country selection when the element changes.
  useEffect(() => {
    setSelectedCountry(
      typeof normalizedElement.defaultValue === "string"
        ? normalizedElement.defaultValue
        : ""
    );

    setCountrySearch("");
    setCountryDropdownOpen(false);
  }, [normalizedElement.id, normalizedElement.defaultValue]);

  // Update date default.
  useEffect(() => {
    setDateValue(normalizedElement.defaultDate || "");
  }, [normalizedElement.defaultDate]);

  // =========================================================
  // 6. OPTIONS AND COMMON FIELD PROPS
  // =========================================================

  const rawOptions = normalizedElement.options || [];

  const options = rawOptions.map((option, index) => {
    if (typeof option === "string") {
      return {
        label: option,
        value: option,
      };
    }

    return {
      label: option.label || option.value || `Option ${index + 1}`,
      value: option.value || option.label || `option-${index + 1}`,
    };
  });

  if (!currentElement) return null;

  const commonTextFieldProps = {
    label: hideLabel ? "" : label,
    labelHidden: hideLabel,
    placeholder: placeholder || undefined,
    helpText: description || undefined,
    requiredIndicator: required,
    autoComplete: "off",

    prefix: selectedIcon ? (
      <div
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F1F1F1",
          border: "1px solid #8A8A8A",
          borderRadius: "4px",
          padding: 0,
          margin: 0,
          boxSizing: "border-box",
        }}
      >
        <Icon source={selectedIcon} />
      </div>
    ) : undefined,
  };

  const commonSelectProps = {
    label: label,
    labelHidden: hideLabel,
    helpText: description || undefined,
  };

  // Phone country data.
  const phoneCountryList = countries;

  const currentPhoneCountry =
    phoneCountryList.find(
      (country) => country.value.toLowerCase() === phoneCountry
    ) || phoneCountryList.find((country) => country.value === "in");

  // Show flag and country code if either setting is enabled.
  const showPhoneCountry =
    normalizedElement.phoneValidation !== false ||
    normalizedElement.showCountryCode !== false;

  // Validate only when validation is enabled.
  const validatePhone =
    normalizedElement.phoneValidation !== false;

  // Change selected phone country.
  const handlePhoneCountryChange = (countryCode) => {
    setPhoneCountry(countryCode.toLowerCase());
    setPhoneError("");
  };

  // Handle phone input and detect international calling codes.
  const handlePhoneChange = (newValue) => {
    const input = String(newValue ?? "");

    if (input.startsWith("+") || input.startsWith("00")) {
      const internationalInput = input.startsWith("00")
        ? `+${input.slice(2)}`
        : input;

      const digits = internationalInput.slice(1).replace(/\D/g, "");

      const matches = phoneCountryList
        .filter((country) => {
          const dialCode = country.dialCode.replace(/\D/g, "");
          return digits.startsWith(dialCode);
        })
        .sort(
          (a, b) =>
            b.dialCode.replace(/\D/g, "").length -
            a.dialCode.replace(/\D/g, "").length
        );

      if (matches.length > 0) {
        const longestCode = matches[0].dialCode;

        const sameCodeMatches = matches.filter(
          (country) => country.dialCode === longestCode
        );

        const matchedCountry =
          sameCodeMatches.find(
            (country) => country.value.toLowerCase() === phoneCountry
          ) || sameCodeMatches[0];

        const dialDigits =
          matchedCountry.dialCode.replace(/\D/g, "");

        setPhoneCountry(matchedCountry.value.toLowerCase());
        setValue(digits.slice(dialDigits.length));
        setPhoneError("");

        return;
      }

      // Preserve an incomplete international number while typing.
      setValue(internationalInput);
      setPhoneError("");
      return;
    }

    // National phone number: digits only.
    setValue(input.replace(/\D/g, ""));
    setPhoneError("");
  };

  // Validate the current phone number.
  const validatePhoneNumber = () => {
    if (!String(value).trim()) {
      if (required) {
        setPhoneError(
          normalizedElement.requiredMessage ||
          `${label} is required`
        );

        return false;
      }

      setPhoneError("");
      return true;
    }

    if (validatePhone) {
      const fullNumber =
        `${currentPhoneCountry?.dialCode || ""}${value}`;

      if (!isValidPhoneNumber(fullNumber)) {
        setPhoneError("Please enter a valid phone number.");
        return false;
      }
    }

    setPhoneError("");
    return true;
  };

  // Limit radio and checkbox columns to a maximum of five.
  const optionsPerLine = Math.min(
    5,
    Math.max(1, Number(normalizedElement.optionsPerLine) || 1)
  );

  const choiceGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${optionsPerLine}, minmax(0, 1fr))`,
    gap: "12px",
    width: "100%",
  };

  // =========================================================
  // 7. HTML SANITIZATION
  // =========================================================

  const sanitizeHTML = (html) => {
    if (typeof window === "undefined") {
      return html;
    }

    const purifier = createDOMPurify(window);
    return purifier.sanitize(html);
  };

  // password valiadtions
  const getPasswordError = () => {
    const password = String(value || "");

    if (required && !password.trim()) {
      return `${label} is required.`;
    }

    // Optional character limits, if enabled in your settings.
    if (normalizedElement.limitCharacters) {
      const min = normalizedElement.minCharacters !== ""
        ? Number(normalizedElement.minCharacters)
        : null;

      const max = normalizedElement.maxCharacters !== ""
        ? Number(normalizedElement.maxCharacters)
        : null;

      if (min !== null && password.length < min) {
        return `Password must contain at least ${min} characters.`;
      }

      if (max !== null && password.length > max) {
        return `Password cannot exceed ${max} characters.`;
      }
    }

    // Apply the selected password validation rule.
    const validationRule = normalizedElement.passwordValidation;

    if (validationRule && validationRule !== "none") {
      const regexString =
        validationRule === "advancedValidateRule"
          ? normalizedElement.advancedPasswordValidation
          : validationRule;

      if (regexString) {
        try {
          const regex = new RegExp(regexString);

          if (!regex.test(password)) {
            return "Password does not meet the required conditions.";
          }
        } catch (error) {
          return "The password validation rule is invalid.";
        }
      }
    }

    // Confirm password validation.
    if (
      normalizedElement.confirmPassword &&
      password !== confirmPasswordValue
    ) {
      return "Passwords do not match.";
    }

    return "";
  };

  // This function will be called by the future Submit handler.
  const validatePassword = () => {
    setPasswordValidationTriggered(true);

    return getPasswordError() === "";
  };

  // =========================================================
  // 8. ELEMENT RENDERING
  // =========================================================

  switch (type) {
    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    case "email":
      return (
        <BlockStack gap="300">
          <TextField
            {...commonTextFieldProps}
            type="email"
            autoComplete="email"
            value={value}
            onChange={setValue}
            readOnly={isReadOnly}
            minLength={
              normalizedElement.limitCharacters &&
                normalizedElement.minCharacters !== ""
                ? Number(normalizedElement.minCharacters)
                : undefined
            }
            maxLength={
              normalizedElement.limitCharacters &&
                normalizedElement.maxCharacters !== ""
                ? Number(normalizedElement.maxCharacters)
                : undefined
            }
          />

          {normalizedElement.confirmEmail && (
            <TextField
              label={normalizedElement.confirmEmailLabel || "Confirm email"}
              labelHidden={hideLabel}
              prefix={commonTextFieldProps.prefix}
              placeholder={
                normalizedElement.confirmEmailPlaceholder ||
                "Confirm your email"
              }
              helpText={
                normalizedElement.confirmEmailDescription || undefined
              }
              type="email"
              autoComplete="email"
              value={confirmEmailValue}
              onChange={setConfirmEmailValue}
              readOnly={isReadOnly}
              requiredIndicator={required}
            />
          )}
        </BlockStack>
      );

    // -------------------------------------------------------
    // NAME
    // -------------------------------------------------------

    case "name":
    case "first_name":
    case "last_name":
      return (
        <TextField
          {...commonTextFieldProps}
          autoComplete="given-name"
          value={value}
          onChange={handleNameChange}
          readOnly={isReadOnly}
          error={nameError || undefined}

          minLength={
            normalizedElement.limitCharacters &&
              normalizedElement.minCharacters !== ""
              ? Number(normalizedElement.minCharacters)
              : undefined
          }
          maxLength={
            normalizedElement.limitCharacters &&
              normalizedElement.maxCharacters !== ""
              ? Number(normalizedElement.maxCharacters)
              : undefined
          }
        />
      );

    // -------------------------------------------------------
    // PHONE
    // -------------------------------------------------------
    case "phone":
      return (
        <BlockStack gap="200">
          {!hideLabel && (
            <Text as="label" variant="bodyMd">
              {label}
              {required && (
                <span style={{ color: "var(--p-color-text-critical)" }}>
                  {" "}*
                </span>
              )}
            </Text>
          )}

          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "stretch",
            }}
          >
            {showPhoneCountry ? (
              <div style={{ position: "relative", flexShrink: 0 }}>
                {/* Selected country button */}
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() =>
                    setCountryDropdownOpen((previous) => !previous)
                  }
                  style={{
                    minWidth: "100px",
                    height: "100%",
                    minHeight: "40px",
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    background: "#F1F1F1",
                    border: "1px solid #8A8A8A",
                    borderRight: 0,
                    borderRadius: "6px 0 0 6px",
                    cursor: isReadOnly ? "default" : "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    className={`fi fi-${currentPhoneCountry?.value || "in"}`}
                    style={{
                      width: "24px",
                      height: "18px",
                      display: "inline-block",
                      flexShrink: 0,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "2px",
                    }}
                  />

                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#303030",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentPhoneCountry?.nativeName || "भारत"}
                  </span>

                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--p-color-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentPhoneCountry?.dialCode || "+91"}
                  </span>

                  {!isReadOnly && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--p-color-text-secondary)",
                      }}
                    >
                      ▾
                    </span>
                  )}
                </button>

                {/* Country dropdown */}
                {countryDropdownOpen && !isReadOnly && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      width: "280px",
                      maxHeight: "260px",
                      overflowY: "auto",
                      overflowX: "hidden",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E1E3E5",
                      borderRadius: "8px",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                      zIndex: 10000,
                      padding: "4px",
                      boxSizing: "border-box",
                    }}
                  >
                    {phoneCountryList.map((country) => {
                      const isSelected = phoneCountry === country.value;

                      return (
                        <button
                          key={country.value}
                          type="button"
                          onClick={() => {
                            handlePhoneCountryChange(country.value);
                            setCountryDropdownOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            minHeight: "42px",
                            padding: "8px 10px",
                            gap: "10px",
                            border: "none",
                            borderRadius: "5px",
                            backgroundColor: isSelected
                              ? "#F1F2F3"
                              : "#FFFFFF",
                            cursor: "pointer",
                            textAlign: "left",
                            boxSizing: "border-box",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "#F6F6F7";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isSelected
                              ? "#F1F2F3"
                              : "#FFFFFF";
                          }}
                        >
                          {/* Country flag */}
                          <span
                            className={`fi fi-${country.value}`}
                            style={{
                              width: "24px",
                              height: "18px",
                              display: "inline-block",
                              flexShrink: 0,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              borderRadius: "2px",
                            }}
                          />


                          {/* English country name + native name */}
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: "13px",
                              fontWeight: isSelected ? 600 : 400,
                              color: "#303030",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {country.name}
                            {country.nativeName &&
                              country.nativeName !== country.name &&
                              ` (${country.nativeName})`}
                          </span>

                          {/* Dial code */}
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "var(--p-color-text-secondary)",
                              flexShrink: 0,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {country.dialCode}
                          </span>

                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : selectedIcon ? (
              <div
                style={{
                  width: "32px",
                  minWidth: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#F1F1F1",
                  border: "1px solid #8A8A8A",
                  borderRight: 0,
                  borderRadius: "6px 0 0 6px",
                  boxSizing: "border-box",
                }}
              >
                <Icon source={selectedIcon} />
              </div>
            ) : null}

            {/* Phone number input */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <TextField
                labelHidden
                label={label}
                type="tel"
                placeholder={
                  placeholder ||
                  (phoneCountry === "in" ? "7876153428" : "Phone number")
                }
                value={value}
                onChange={handlePhoneChange}
                readOnly={isReadOnly}
                error={phoneError || undefined}
                autoComplete="tel-national"
              />
            </div>
          </div>

          {descriptionText}
        </BlockStack>
      );

    // -------------------------------------------------------
    // PASSWORD
    // -------------------------------------------------------


    case "password": {
      const passwordError = passwordValidationTriggered
        ? getPasswordError()
        : "";

      const confirmPasswordError =
        passwordValidationTriggered &&
          normalizedElement.confirmPassword &&
          value !== confirmPasswordValue
          ? "Passwords do not match."
          : "";

      return (
        <BlockStack gap="300">

          {/* Password input */}
          <TextField
            {...commonTextFieldProps}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={value}
            onChange={(newValue) => {
              setValue(newValue);
            }}
            readOnly={isReadOnly}
            error={passwordError || undefined}
            minLength={
              normalizedElement.limitCharacters &&
                normalizedElement.minCharacters !== ""
                ? Number(normalizedElement.minCharacters)
                : undefined
            }
            maxLength={
              normalizedElement.limitCharacters &&
                normalizedElement.maxCharacters !== ""
                ? Number(normalizedElement.maxCharacters)
                : undefined
            }
            suffix={
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  cursor: isReadOnly ? "default" : "pointer",
                }}
              >
                <Icon
                  source={
                    showPassword
                      ? PolarisIcons.HideIcon
                      : PolarisIcons.ViewIcon
                  }
                />
              </button>
            }
          />

          {/* Confirm password */}
          {normalizedElement.confirmPassword && (
            <TextField
              type={showConfirmPassword ? "text" : "password"}
              label={
                normalizedElement.confirmPasswordLabel ||
                "Confirm Password"
              }
              placeholder={
                normalizedElement.confirmPasswordPlaceholder ||
                "Confirm your password"
              }
              helpText={
                normalizedElement.confirmPasswordDescription || undefined
              }
              value={confirmPasswordValue}
              onChange={setConfirmPasswordValue}
              autoComplete="new-password"
              readOnly={isReadOnly}
              // show icon with styling
              prefix={commonTextFieldProps.prefix}
              minLength={
                normalizedElement.limitCharacters &&
                  normalizedElement.minCharacters !== ""
                  ? Number(normalizedElement.minCharacters)
                  : undefined
              }
              maxLength={
                normalizedElement.limitCharacters &&
                  normalizedElement.maxCharacters !== ""
                  ? Number(normalizedElement.maxCharacters)
                  : undefined
              }
              error={confirmPasswordError || undefined}
              suffix={
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    cursor: isReadOnly ? "default" : "pointer",
                  }}
                >
                  <Icon
                    source={
                      showConfirmPassword
                        ? PolarisIcons.HideIcon
                        : PolarisIcons.ViewIcon
                    }
                  />
                </button>
              }
            />
          )}

        </BlockStack>
      );
    }


    // -------------------------------------------------------
    // COUNTRY
    // -------------------------------------------------------

   case "country": {
  const selectedCountryDetails = countries.find(
    (country) => country.value === selectedCountry
  );

  const filteredCountries = countries.filter((country) => {
    const search = countrySearch.toLowerCase();

    return (
      country.name.toLowerCase().includes(search) ||
      (country.nativeName || "").toLowerCase().includes(search)
    );
  });

  const handleCountrySelect = (country) => {
    setSelectedCountry(country.value);
    setValue(country.value);
    setCountryDropdownOpen(false);
    setCountrySearch("");
  };

  return (
    <BlockStack gap="200">
      {fieldLabelWithIcon}

      <div style={{ position: "relative", width: "100%" }}>

        {/* SELECTED COUNTRY / DROPDOWN BUTTON */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() =>
            setCountryDropdownOpen((previous) => !previous)
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            width: "100%",
            minHeight: "40px",
            padding: "8px 12px",
            background: "#FFFFFF",
            border: "1px solid #8A8A8A",
            borderRadius: "6px",
            cursor: isReadOnly ? "default" : "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              minWidth: 0,
            }}
          >
            {/* SELECTED ICON */}
            {selectedIcon && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  flexShrink: 0,
                }}
              >
                <Icon source={selectedIcon} />
              </span>
            )}

            {/* COUNTRY FLAG */}
            {normalizedElement.showFlags &&
              selectedCountryDetails && (
                <span
                  className={`fi fi-${selectedCountryDetails.value.toLowerCase()}`}
                  aria-label={`${selectedCountryDetails.name} flag`}
                  style={{
                    display: "inline-block",
                    width: "24px",
                    height: "18px",
                    flexShrink: 0,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "2px",
                  }}
                />
              )}

            {/* COUNTRY NAME / PLACEHOLDER */}
            <span
              style={{
                color: selectedCountryDetails
                  ? "#303030"
                  : "#8C9196",
                fontSize: "14px",
              }}
            >
              {selectedCountryDetails?.name ||
                normalizedElement.placeholder ||
                "Please select a country"}
            </span>
          </span>

          {/* DROPDOWN ARROW */}
          <span
            style={{
              color: "#6D7175",
              display: "inline-block",
              transition: "transform 250ms ease",
              transform: countryDropdownOpen
                ? "rotate(180deg)"
                : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </button>

        {/* COUNTRY DROPDOWN WITH SMOOTH ANIMATION */}
        {!isReadOnly && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              width: "100%",
              maxHeight: countryDropdownOpen ? "280px" : "0px",
              opacity: countryDropdownOpen ? 1 : 0,
              visibility: countryDropdownOpen
                ? "visible"
                : "hidden",
              transform: countryDropdownOpen
                ? "translateY(0)"
                : "translateY(-8px)",
              background: "#FFFFFF",
              border: countryDropdownOpen
                ? "1px solid #E1E3E5"
                : "1px solid transparent",
              borderRadius: "8px",
              boxShadow: countryDropdownOpen
                ? "0 4px 16px rgba(0,0,0,0.12)"
                : "none",
              zIndex: 10000,
              boxSizing: "border-box",
              overflow: "hidden",
              transition:
                "max-height 250ms ease, opacity 200ms ease, transform 250ms ease, visibility 250ms ease, border-color 250ms ease",
              pointerEvents: countryDropdownOpen ? "auto" : "none",
            }}
          >

            {/* SEARCH INPUT */}
            {normalizedElement.enableSearch && (
              <div
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #E1E3E5",
                }}
              >
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(event) =>
                    setCountrySearch(event.target.value)
                  }
                  placeholder="Search countries..."
                  autoComplete="off"
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    border: "1px solid #8A8A8A",
                    borderRadius: "5px",
                    outline: "none",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* COUNTRY LIST */}
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                padding: "4px",
              }}
            >
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => {
                  const isSelected =
                    selectedCountry === country.value;

                  return (
                    <button
                      key={country.value}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        minHeight: "40px",
                        padding: "8px 10px",
                        border: "none",
                        borderRadius: "5px",
                        background: isSelected
                          ? "#F1F2F3"
                          : "#FFFFFF",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {/* COUNTRY FLAG */}
                      {normalizedElement.showFlags && (
                        <span
                          className={`fi fi-${country.value.toLowerCase()}`}
                          aria-label={`${country.name} flag`}
                          style={{
                            display: "inline-block",
                            width: "24px",
                            height: "18px",
                            flexShrink: 0,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            borderRadius: "2px",
                          }}
                        />
                      )}

                      {/* COUNTRY NAME */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: "13px",
                          color: "#303030",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {country.name}
                      </span>

                      {/* SELECTED CHECK ICON */}
                      {isSelected && (
                        <Icon source={PolarisIcons.CheckIcon} />
                      )}
                    </button>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "14px",
                    textAlign: "center",
                  }}
                >
                  <Text
                    as="p"
                    variant="bodySm"
                    tone="subdued"
                  >
                    No countries found.
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {descriptionText}
    </BlockStack>
  );
}
    // -------------------------------------------------------
    // DROPDOWN AND SELECT
    // -------------------------------------------------------

    case "dropdown":
    case "select":
      return (
        <Select
          {...commonSelectProps}
          options={[{ label: "Dropdown", value: "" }, ...options]}
          value={value}
          onChange={setValue}
          disabled={isReadOnly}
        />
      );

    // -------------------------------------------------------
    // CHECKBOX
    // -------------------------------------------------------

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
                disabled={isReadOnly}
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

    // -------------------------------------------------------
    // RADIO
    // -------------------------------------------------------

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
                  cursor: isReadOnly ? "default" : "pointer",
                }}
              >
                <input
                  type="radio"
                  name={`radio-${normalizedElement.id}`}
                  value={option.value}
                  checked={selected[0] === option.value}
                  disabled={isReadOnly}
                  onChange={() => setSelected([option.value])}
                />

                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {descriptionText}
        </BlockStack>
      );

    // -------------------------------------------------------
    // CONSENT
    // -------------------------------------------------------

    case "consent":
      return (
        <BlockStack gap="200">
          <Checkbox
            label={
              <div
                className="rich-text-preview"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(
                    normalizedElement.label ||
                    "<p>I agree to terms and conditions.</p>"
                  ),
                }}
              />
            }
            checked={checked}
            disabled={isReadOnly}
            onChange={setChecked}
          />

          {descriptionText}
        </BlockStack>
      );

    // -------------------------------------------------------
    // BUTTON
    // -------------------------------------------------------

    case "button":
      return (
        <InlineStack gap="200" align="center">
          {(normalizedElement.options || []).map((option, index) => (
            <Button
              key={option.id || index}
              disabled={isReadOnly}
            >
              {option.label}
            </Button>
          ))}
        </InlineStack>
      );

    // -------------------------------------------------------
    // URL
    // -------------------------------------------------------

    case "url":
      return (
        <TextField
          {...commonTextFieldProps}
          type="url"
          placeholder={placeholder || "https://example.com"}
          value={value}
          onChange={setValue}
          autoComplete="url"
          readOnly={isReadOnly}
          prefix={
            normalizedElement.showIcon !== false ? (
              <Icon source={PolarisIcons.LinkIcon} />
            ) : undefined
          }
        />
      );

    // -------------------------------------------------------
    // DATE
    // -------------------------------------------------------

    case "date":
      return (
        <TextField
          {...commonTextFieldProps}
          value={dateValue}
          onChange={setDateValue}
          readOnly={isReadOnly}
        />
      );

    // -------------------------------------------------------
    // TEXT
    // -------------------------------------------------------

    case "text":
    case "short_text":
      return (
        <TextField
          {...commonTextFieldProps}
          value={value}
          onChange={setValue}
          readOnly={isReadOnly}
        />
      );

    // -------------------------------------------------------
    // TEXTAREA
    // -------------------------------------------------------

    case "textarea":
      return (
        <TextField
          {...commonTextFieldProps}
          multiline={3}
          value={value}
          onChange={setValue}
          readOnly={isReadOnly}
        />
      );

    // -------------------------------------------------------
    // NUMBER
    // -------------------------------------------------------

    case "number":
      return (
        <TextField
          {...commonTextFieldProps}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleNumberChange}
          readOnly={isReadOnly}
          error={numberError || undefined}
        />
      );

    // -------------------------------------------------------
    // QUANTITY
    // -------------------------------------------------------

    case "quantity": {
      const parsedMin = Number(normalizedElement.minValue);
      const parsedMax = Number(normalizedElement.maxValue);

      const min =
        normalizedElement.setMinValue &&
          Number.isFinite(parsedMin)
          ? parsedMin
          : 0;

      const max =
        normalizedElement.setMaxValue &&
          normalizedElement.maxValue !== "" &&
          Number.isFinite(parsedMax)
          ? Math.max(min, parsedMax)
          : Infinity;

      const parsedValue = Number(value);

      const currentValue =
        value === "" ||
          value === null ||
          value === undefined ||
          !Number.isFinite(parsedValue)
          ? min
          : parsedValue;

      const safeValue = Math.min(
        max,
        Math.max(min, currentValue)
      );

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
            disabled={isReadOnly || safeValue <= min}
            onClick={decreaseValue}
            style={{
              border: "none",
              background: "transparent",
              color: safeValue <= min ? "#C9CCCF" : "#555",
              fontSize: "20px",
              cursor:
                isReadOnly || safeValue <= min
                  ? "not-allowed"
                  : "pointer",
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
            {label || "Quantity"}
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
            disabled={isReadOnly || safeValue >= max}
            onClick={increaseValue}
            style={{
              border: "none",
              background: "transparent",
              color: safeValue >= max ? "#C9CCCF" : "#555",
              fontSize: "20px",
              cursor:
                isReadOnly || safeValue >= max
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            +
          </button>
        </div>
      );
    }

    // -------------------------------------------------------
    // REPEATER
    // -------------------------------------------------------

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
                readOnly={isReadOnly}
              />
            </div>

            <Button
              icon={PolarisIcons.DeleteIcon}
              accessibilityLabel="Remove"
              disabled={isReadOnly}
            />
          </InlineStack>

          <div>
            <Button
              icon={PolarisIcons.PlusIcon}
              disabled={isReadOnly}
            >
              {normalizedElement.addButtonText || "Add more"}
            </Button>
          </div>

          {descriptionText}
        </BlockStack>
      );

    // -------------------------------------------------------
    // RATING LEVEL
    // -------------------------------------------------------

    case "rating_level": {
      const maxLevel = Math.min(
        10,
        Math.max(2, Number(normalizedElement.maxLevel) || 5)
      );

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Array.from({ length: maxLevel }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                disabled={isReadOnly}
                onClick={() => setRating(n)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  cursor: isReadOnly ? "not-allowed" : "pointer",
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

    // -------------------------------------------------------
    // STAR RATING
    // -------------------------------------------------------

    case "rating_star": {
      const customRatingIcon =
        normalizedElement.useCustomRatingIcon &&
          normalizedElement.ratingIcon
          ? PolarisIcons[normalizedElement.ratingIcon]
          : null;

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              containerType: "inline-size",
              containerName: "rating-container",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                gap: "clamp(2px, 2cqw, 9px)",
                alignItems: "center",
                justifyContent: "flex-start",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    className="rating-star-button"
                    disabled={isReadOnly}
                    onClick={() => setRating(star)}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      maxWidth: "90px",
                      minWidth: 0,
                      border: "none",
                      background: "transparent",
                      cursor: isReadOnly ? "default" : "pointer",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: star <= rating ? "#F5A623" : "#C9CCCF",
                      fontSize: "clamp(18px, 12cqw, 54px)",
                      lineHeight: 1,
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    {customRatingIcon ? (
                      <span
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon source={customRatingIcon} />
                      </span>
                    ) : (
                      "★"
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
          </div>

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // FEEDBACK
    // -------------------------------------------------------

    case "feedback": {
      const emojis = ["😡", "🙁", "😐", "🙂", "😍"];

      const items =
        options.length > 0
          ? options
          : emojis.map((emoji) => ({
            label: emoji,
            value: emoji,
          }));

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              containerType: "inline-size",
              containerName: "feedback-container",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                gap: "clamp(2px, 2cqw, 9px)",
                alignItems: "center",
                justifyContent: "flex-start",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.value}
                  style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setSelected([item.value])}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      maxWidth: "90px",
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "clamp(18px, 12cqw, 54px)",
                      lineHeight: 1,
                      background: "transparent",
                      cursor: isReadOnly ? "default" : "pointer",
                      padding: "2px",
                      boxSizing: "border-box",
                      overflow: "hidden",
                      borderRadius: "8px",
                      border:
                        selected[0] === item.value
                          ? "2px solid #303030"
                          : "1px solid transparent",
                    }}
                  >
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // SIGNATURE
    // The hooks are now inside SignaturePreview.
    // -------------------------------------------------------

    case "signature":
      return (
        <SignaturePreview
          element={normalizedElement}
          label={label}
          hideLabel={hideLabel}
          required={required}
          descriptionText={descriptionText}
          isReadOnly={isReadOnly}
        />
      );

    // -------------------------------------------------------
    // HEADING
    // -------------------------------------------------------

    case "heading": {
      const headingConfig = {
        h1: { tag: "h1", variant: "heading2xl" },
        h2: { tag: "h2", variant: "headingXl" },
        h3: { tag: "h3", variant: "headingLg" },
        h4: { tag: "h4", variant: "headingMd" },
        h5: { tag: "h5", variant: "headingSm" },
        h6: { tag: "h6", variant: "headingXs" },
      };

      const config =
        headingConfig[normalizedElement.headingTag] ||
        headingConfig.h2;

      return (
        <BlockStack gap="200">
          <Text as={config.tag} variant={config.variant}>
            {normalizedElement.content || "Heading"}
          </Text>

          {normalizedElement.description && (
            <Text as="p" variant="bodyMd">
              {normalizedElement.description}
            </Text>
          )}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // PARAGRAPH
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // CUSTOM HTML
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // DIVIDER
    // -------------------------------------------------------

    case "divider":
      return (
        <hr
          style={{
            border: "none",
            borderTop: `2px ${normalizedElement.dividerStyle || "solid"
              } ${normalizedElement.dividerColor || "currentColor"
              }`,
            display: normalizedElement.hideDivider ? "none" : "block",
            width: "100%",
            margin: 0,
          }}
        />
      );

    // -------------------------------------------------------
    // FILE UPLOAD
    // -------------------------------------------------------

    case "file_upload": {
      const buttonText =
        normalizedElement.buttonText || "Browse file";

      const filePlaceholder =
        normalizedElement.placeholder || "Choose file or drag here";

      const hint =
        normalizedElement.hint || "PNG, GIF, SVG.";

      const acceptedFileTypes = Array.isArray(
        normalizedElement.acceptedFileTypes
      )
        ? normalizedElement.acceptedFileTypes
        : [];

      return (
        <BlockStack gap="200">
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
            <Text as="p" variant="bodyMd">
              {filePlaceholder}
            </Text>

            <Text as="p" variant="bodySm" tone="subdued">
              {acceptedFileTypes.length > 0
                ? `Supported formats: ${acceptedFileTypes
                  .join(", ")
                  .toUpperCase()}`
                : hint}
            </Text>

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

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // IMAGE OPTIONS
    // -------------------------------------------------------

    case "image_options":
      return (
        <BlockStack gap="200">
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
                cursor: isReadOnly ? "default" : "pointer",
                pointerEvents: isReadOnly ? "none" : "auto",
              }}
            >
              {imagePreview ? "Change image" : "Browse image"}

              <input
                type="file"
                accept="image/*"
                hidden
                disabled={isReadOnly}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file && file.type.startsWith("image/")) {
                    setImagePreview((previous) => {
                      if (previous) URL.revokeObjectURL(previous);
                      return URL.createObjectURL(file);
                    });
                  }
                }}
              />
            </label>
          </div>

          {descriptionText}
        </BlockStack>
      );

    // -------------------------------------------------------
    // COLOR SWATCH
    // -------------------------------------------------------

    case "color_swatch": {
      const colors = Array.isArray(normalizedElement.colors)
        ? normalizedElement.colors
        : ["#E53935", "#1E88E5", "#43A047", "#FDD835"];

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {colors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                type="button"
                aria-label={`Select ${color}`}
                disabled={isReadOnly}
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
                  cursor: isReadOnly ? "default" : "pointer",
                }}
              />
            ))}
          </div>

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // COLOR PICKER
    // -------------------------------------------------------

    case "color_picker":
      return (
        <BlockStack gap="200">
          <div
            style={{
              pointerEvents: isReadOnly ? "none" : "auto",
              opacity: isReadOnly ? 0.6 : 1,
            }}
          >
            <ColorInput
              label={hideLabel ? "" : label}
              value={colorValue}
              onChange={setColorValue}
            />
          </div>

          {descriptionText}
        </BlockStack>
      );

    // -------------------------------------------------------
    // FORM HEADER
    // -------------------------------------------------------

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

      const config =
        headingConfig[headingTag] || headingConfig.h2;

      const HeadingTag = config.tag;

      const headingFontSize =
        normalizedElement.headingFontSize !== undefined &&
          normalizedElement.headingFontSize !== ""
          ? Number(normalizedElement.headingFontSize)
          : config.fontSize;

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
                fontSize: `${headingFontSize}px`,
                fontWeight: 100,
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
                marginTop:
                  normalizedElement.showHeader !== false ? "8px" : 0,
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

    // -------------------------------------------------------
    // FORM FOOTER
    // -------------------------------------------------------

    case "form_footer":
      return (
        <BlockStack gap="300">
          {normalizedElement.text && (
            <Text as="p">{normalizedElement.text}</Text>
          )}

          {normalizedElement.content && (
            <div
              className="rich-text-preview"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(normalizedElement.content),
              }}
            />
          )}

          {normalizedElement.showDescriptionAtBottom &&
            normalizedElement.bottomDescription && (
              <Text as="p" variant="bodySm" tone="subdued">
                {normalizedElement.bottomDescription}
              </Text>
            )}

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
            {normalizedElement.showPreviousButton && (
              <div
                style={{
                  width: normalizedElement.fullWidthButton
                    ? "100%"
                    : "auto",
                }}
              >
                <Button
                  fullWidth={Boolean(normalizedElement.fullWidthButton)}
                  disabled={isReadOnly}
                >
                  {normalizedElement.previousText || "Previous"}
                </Button>
              </div>
            )}

            {normalizedElement.showNextButton && (
              <div
                style={{
                  width: normalizedElement.fullWidthButton
                    ? "100%"
                    : "auto",
                }}
              >
                <Button
                  fullWidth={Boolean(normalizedElement.fullWidthButton)}
                  disabled={isReadOnly}
                >
                  {normalizedElement.nextText || "Next"}
                </Button>
              </div>
            )}

            {normalizedElement.showResetButton && (
              <div
                style={{
                  width: normalizedElement.fullWidthButton
                    ? "100%"
                    : "auto",
                }}
              >
                <Button
                  fullWidth={Boolean(normalizedElement.fullWidthButton)}
                  disabled={isReadOnly}
                >
                  {normalizedElement.resetButtonText || "Reset"}
                </Button>
              </div>
            )}

            <button
              type="button"
              disabled={isReadOnly}
              style={{
                width: normalizedElement.fullWidthButton
                  ? "100%"
                  : "auto",
                backgroundColor:
                  normalizedElement.buttonBackgroundColor || "#303030",
                color:
                  normalizedElement.buttonTextColor || "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isReadOnly ? "not-allowed" : "pointer",
              }}
            >
              {normalizedElement.submitText || "Submit"}
            </button>
          </div>
        </BlockStack>
      );

    // -------------------------------------------------------
    // HIDDEN FIELD
    // -------------------------------------------------------

    case "hidden":
      return (
        <div
          style={{
            border: "1px dashed #8c9196",
            borderRadius: "8px",
            padding: "10px 24px",
            background: "#f7f7f7",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Text as="span" variant="bodySm" tone="subdued">
            {value || "Hidden field"}
          </Text>

          <Text as="p" variant="bodySm" tone="subdued">
            This field will not be visible to customers on the published form.
          </Text>
        </div>
      );

    // -------------------------------------------------------
    // RANGE SLIDER
    // -------------------------------------------------------

    case "range_slider": {
      const min = Number(normalizedElement.min ?? 0);
      const max = Number(normalizedElement.max ?? 100);
      const step = Math.max(
        0.000001,
        Number(normalizedElement.step) || 1
      );

      const currentRangeValue = Math.min(
        max,
        Math.max(min, rangeValue)
      );

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentRangeValue}
            disabled={isReadOnly}
            onChange={(event) =>
              setRangeValue(Number(event.target.value))
            }
            style={{ width: "100%" }}
          />

          {normalizedElement.showRangeValue !== false && (
            <Text as="p" variant="bodySm">
              {currentRangeValue}
            </Text>
          )}

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // MATRIX
    // -------------------------------------------------------

    case "matrix": {
      const toLabel = (item, index, prefix) =>
        typeof item === "string"
          ? item
          : item?.label || item?.value || `${prefix} ${index + 1}`;

      const matrixRows = (
        normalizedElement.rows?.length
          ? normalizedElement.rows
          : ["Row 1", "Row 2"]
      ).map((row, index) => toLabel(row, index, "Row"));

      const matrixCols = (
        normalizedElement.columns?.length
          ? normalizedElement.columns
          : options.length
            ? options
            : ["Poor", "Good", "Great"]
      ).map((column, index) =>
        toLabel(column, index, "Column")
      );

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  <th />

                  {matrixCols.map((column) => (
                    <th
                      key={column}
                      style={{ padding: "6px", fontWeight: 500 }}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {matrixRows.map((row) => (
                  <tr
                    key={row}
                    style={{ borderTop: "1px solid #e1e3e5" }}
                  >
                    <td style={{ padding: "8px 6px" }}>
                      {row}
                    </td>

                    {matrixCols.map((column) => (
                      <td
                        key={column}
                        style={{ textAlign: "center" }}
                      >
                        <input
                          type="radio"
                          name={`matrix-${normalizedElement.id}-${row}`}
                          checked={selected.includes(
                            `${row}::${column}`
                          )}
                          disabled={isReadOnly}
                          onChange={() =>
                            setSelected((previous) => [
                              ...previous.filter(
                                (item) => !item.startsWith(`${row}::`)
                              ),
                              `${row}::${column}`,
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

    // -------------------------------------------------------
    // SWITCH
    // -------------------------------------------------------

    case "switch":
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <InlineStack align="start" blockAlign="center" gap="300">
            <button
              type="button"
              role="switch"
              aria-checked={switchValue}
              disabled={isReadOnly}
              onClick={() => setSwitchValue((previous) => !previous)}
              className={`preview-switch ${switchValue ? "is-on" : "is-off"
                }`}
            >
              <span className="preview-switch__thumb" />
            </button>

            <Text as="span" variant="bodySm">
              {switchValue
                ? normalizedElement.onText || "On"
                : normalizedElement.offText || "Off"}
            </Text>
          </InlineStack>

          {descriptionText}
        </BlockStack>
      );

    // -------------------------------------------------------
    // IMAGE DROPDOWN
    // -------------------------------------------------------

    case "image_dropdown": {
      const imageOptions = rawOptions.filter(
        (option) =>
          typeof option === "object" && option?.image
      );

      return (
        <BlockStack gap="200">
          <Select
            {...commonSelectProps}
            options={[
              { label: "Select an option", value: "" },
              ...options,
            ]}
            value={value}
            onChange={setValue}
            disabled={isReadOnly}
          />

          {imageOptions.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {imageOptions.map((option, index) => (
                <img
                  key={option.value || index}
                  src={option.image}
                  alt={option.label || ""}
                  onClick={() => {
                    if (!isReadOnly) {
                      setValue(option.value || option.label);
                    }
                  }}
                  style={{
                    width: "44px",
                    height: "44px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    cursor: isReadOnly ? "default" : "pointer",
                    border:
                      value === (option.value || option.label)
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

    // -------------------------------------------------------
    // PRODUCT
    // -------------------------------------------------------

    case "product": {
      const selectedProductIds = Array.isArray(
        normalizedElement.selectedProductIds
      )
        ? normalizedElement.selectedProductIds
        : [];

      const selectedProducts = products.filter((product) =>
        selectedProductIds.includes(product.id)
      );

      const isList = normalizedElement.productLayout === "list";
      const showSearch = normalizedElement.showSearchBar !== false;

      const filteredProducts = showSearch
        ? selectedProducts.filter((product) =>
          (product.title || "")
            .toLowerCase()
            .includes(String(value || "").toLowerCase())
        )
        : selectedProducts;

      return (
        <BlockStack gap="300">
          {fieldLabelWithIcon}

          {showSearch && (
            <TextField
              placeholder={
                normalizedElement.placeholder || "Search products"
              }
              prefix={<Icon source={PolarisIcons.SearchIcon} />}
              value={value}
              onChange={setValue}
              autoComplete="off"
              readOnly={isReadOnly}
            />
          )}

          {productsLoading && (
            <Text as="p" tone="subdued" variant="bodySm">
              Loading Shopify products...
            </Text>
          )}

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
                          if (isReadOnly) return;

                          if (normalizedElement.allowMultiple) {
                            setSelected((previous) =>
                              isSelected
                                ? previous.filter(
                                  (id) => id !== product.id
                                )
                                : [...previous, product.id]
                            );
                          } else {
                            setSelected(
                              isSelected ? [] : [product.id]
                            );
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
                          cursor: isReadOnly ? "default" : "pointer",
                          background: "#fff",
                          padding: isList ? "8px" : "0",
                          minWidth: 0,
                        }}
                      >
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
                            <Text as="p" variant="bodySm" tone="subdued">
                              {product.description
                                .trim()
                                .split(/\s+/)
                                .slice(0, 10)
                                .join(" ")}
                              {product.description.trim().split(/\s+/).length >
                                10
                                ? "..."
                                : ""}
                            </Text>
                          )}

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

    // -------------------------------------------------------
    // DEFAULT FIELD
    // -------------------------------------------------------

    default:
      return (
        <TextField
          {...commonTextFieldProps}
          value={value}
          onChange={setValue}
          readOnly={isReadOnly}
        />
      );
  }
}
