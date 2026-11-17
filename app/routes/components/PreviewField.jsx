
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
  Combobox,
  Listbox,


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
  onChange, // to upadte the val 
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

  const [selected, setSelected] = useState(() =>
    normalizedElement.defaultValue
      ? [normalizedElement.defaultValue]
      : []
  );

  const [otherValue, setOtherValue] = useState(
    normalizedElement.otherValue || ""
  );
  useEffect(() => {
    setSelected(
      normalizedElement.defaultValue
        ? [normalizedElement.defaultValue]
        : []
    );

    setOtherValue("");
  }, [normalizedElement.id, normalizedElement.defaultValue]);

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

  // dropdown 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  useEffect(() => {
    setDropdownOpen(false);
    setDropdownSearch("");
  }, [normalizedElement.id]);



  // Date and time.
  const [dateValue, setDateValue] = useState(
    normalizedElement.defaultDate || ""
  );

  // File and image previews.
  const [imagePreview, setImagePreview] = useState([]);

  // Rating and range values.
  const [rating, setRating] = useState(0);
  const [rangeValue, setRangeValue] = useState(() => {
    const min = Number(normalizedElement.min ?? 0);
    const max = Number(normalizedElement.max ?? 100);
    const defaultValue = Number(normalizedElement.defaultValue);

    return Number.isFinite(defaultValue)
      ? Math.min(max, Math.max(min, defaultValue))
      : min;
  });

  // files state 
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  //effects 
  useEffect(() => {
    const min = Number(normalizedElement.min ?? 0);
    const max = Number(normalizedElement.max ?? 100);
    const defaultValue = Number(normalizedElement.defaultValue);

    const newValue = Number.isFinite(defaultValue)
      ? defaultValue
      : min;

    setRangeValue(Math.min(max, Math.max(min, newValue)));
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    normalizedElement.min,
    normalizedElement.max,
  ]);

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
  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);
  useEffect(() => {
    setImageDropdownOpen(false);
  }, [normalizedElement.id]);

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
  // validateTextField this gives error if name valdation fails 
  const validateTextField = (element, value) => {
    if (
      element.nameValidation &&
      value &&
      !/^[a-zA-Z0-9 ]+$/.test(value)
    ) {
      return "Only letters and numbers are allowed.";
    }

    return "";
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
  //Add the file validation logic
  const acceptedFileTypes = Array.isArray(normalizedElement.acceptedFileTypes)
    ? normalizedElement.acceptedFileTypes
    : [];

  const acceptAttribute = acceptedFileTypes
    .map((extension) => `.${extension}`)
    .join(",");

  const fileSizeLimit = Number(normalizedElement.fileSizeLimit) || 0;
  const maxFileSize = fileSizeLimit * 1024 * 1024;

  const numberOfFilesLimit =
    Number(normalizedElement.numberOfFilesLimit) || 0;

  const maxFiles = normalizedElement.allowMultiple
    ? numberOfFilesLimit
    : 1;

  const handleFileSelection = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    setFileError("");

    const validFiles = [];

    for (const file of incomingFiles) {
      // Check allowed extension.
      const extension = file.name.split(".").pop().toLowerCase();

      if (
        acceptedFileTypes.length > 0 &&
        !acceptedFileTypes.includes(extension)
      ) {
        setFileError(`.${extension} files are not allowed.`);
        continue;
      }

      // Check file size.
      if (maxFileSize > 0 && file.size > maxFileSize) {
        setFileError(
          `${file.name} exceeds the ${fileSizeLimit} MB size limit.`
        );
        continue;
      }

      validFiles.push(file);
    }

    // Check number of files.
    const combinedFiles = normalizedElement.allowMultiple
      ? [...selectedFiles, ...validFiles]
      : validFiles.slice(0, 1);

    if (maxFiles > 0 && combinedFiles.length > maxFiles) {
      setFileError(`You can select a maximum of ${maxFiles} files.`);
      setSelectedFiles(combinedFiles.slice(0, maxFiles));
    } else {
      setSelectedFiles(combinedFiles);
    }

    // Allow selecting the same file again.
    event.target.value = "";
  };


  // =========================================================
  // 8. ELEMENT RENDERING
  // =========================================================
  // Completely hide the divider when Hide divider is enabled.
  if (type === "divider" && normalizedElement.hideDivider) {
    return null;
  }


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
            prefix:inputIconPrefix
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
            className="phone-field-shell"
            style={{
              display: "flex",
              width: "100%",
              minWidth: 0,
              alignItems: "stretch",
              position: "relative",
              zIndex: countryDropdownOpen ? 10000 : 1,
              overflow: "visible",
              isolation: "isolate",
              background: "#F6F6F7",
              border: phoneError
                ? "1px solid var(--p-color-border-critical)"
                : "1px solid #C9CCCF",
              borderRadius: "8px",
              boxSizing: "border-box",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            {/* COUNTRY SELECTOR */}
            {showPhoneCountry ? (
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                  zIndex: countryDropdownOpen ? 10002 : 1,
                }}
              >
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() =>
                    setCountryDropdownOpen((previous) => !previous)
                  }
                  style={{
                    height: "46px",
                    minWidth: "80px",
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "transparent",
                    border: "none",
                    borderRight: "1px solid #D8DADD",
                    borderRadius: "8px 0 0 8px",
                    cursor: isReadOnly ? "default" : "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  {/* COUNTRY FLAG */}
                  <span
                    className={`fi fi-${currentPhoneCountry?.value || "in"}`}
                    style={{
                      width: "20px",
                      height: "15px",
                      display: "inline-block",
                      flexShrink: 0,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "2px",
                    }}
                  />

                  {/* DIAL CODE */}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#303030",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentPhoneCountry?.dialCode || "+91"}
                  </span>

                  {!isReadOnly && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#777777",
                      }}
                    >
                      ▾
                    </span>
                  )}
                </button>

                {/* COUNTRY DROPDOWN */}
                {countryDropdownOpen && !isReadOnly && (
                  <div
                    className="phone-country-dropdown"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      width: "280px",
                      maxHeight: "260px",
                      overflowY: "auto",
                      overflowX: "hidden",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E1E3E5",
                      borderRadius: "10px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                      zIndex: 10003,
                      padding: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    {phoneCountryList.map((country) => {
                      const isSelected =
                        phoneCountry === country.value.toLowerCase();

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
                            minHeight: "40px",
                            padding: "8px 10px",
                            gap: "10px",
                            border: "none",
                            borderRadius: "6px",
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
                          {/* COUNTRY FLAG */}
                          <span
                            className={`fi fi-${country.value.toLowerCase()}`}
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

                          {/* COUNTRY NAME */}
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

                          {/* DIAL CODE */}
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#6D7175",
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
              /* SELECTED FIELD ICON */
              <div
                style={{
                  width: "42px",
                  minWidth: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#E8E8E9",
                  borderRight: "1px solid #D8DADD",
                  borderRadius: "8px 0 0 8px",
                  boxSizing: "border-box",
                }}
              >
                <Icon source={selectedIcon} />
              </div>
            ) : null}

            {/* PHONE NUMBER INPUT */}
            <div
              className="phone-number-input"
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
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

      const passwordSuffix = (
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="password-visibility-button"
          style={{
            border: "none",
            background: "transparent",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6D7175",
            cursor: isReadOnly ? "default" : "pointer",
            borderRadius: "5px",
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
      );

      return (
        <BlockStack gap="300">

          {/* PASSWORD INPUT */}
          <div className="password-field-control">
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
              suffix={passwordSuffix}
            />
          </div>

          {/* CONFIRM PASSWORD */}
          {normalizedElement.confirmPassword && (
            <div className="password-field-control">
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
                    className="password-visibility-button"
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6D7175",
                      cursor: isReadOnly ? "default" : "pointer",
                      borderRadius: "5px",
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
            </div>
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
    case "select": {
      const dropdownOptions = (normalizedElement.options || []).map((option) => ({
        label:
          typeof option === "string"
            ? option
            : option.label || option.value,
        value:
          typeof option === "string"
            ? option
            : option.value || option.label,
      }));

      const selectedOption = dropdownOptions.find(
        (option) => option.value === value
      );

      const filteredOptions = dropdownOptions.filter((option) =>
        option.label.toLowerCase().includes(dropdownSearch.toLowerCase())
      );

      const handleDropdownSelect = (option) => {
        setValue(option.value);
        setDropdownOpen(false);
        setDropdownSearch("");
      };

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={{ position: "relative", width: "100%" }}>
            {/* DROPDOWN BUTTON */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setDropdownOpen((previous) => !previous)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                  color: selectedOption ? "#303030" : "#8C9196",
                  fontSize: "14px",
                }}
              >
                {selectedOption?.label ||
                  normalizedElement.placeholder ||
                  "Please select"}
              </span>

              <span
                style={{
                  color: "#6D7175",
                  transition: "transform 250ms ease",
                  transform: dropdownOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </button>

            {/* DROPDOWN PANEL */}
            {!isReadOnly && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  width: "100%",
                  maxHeight: dropdownOpen ? "280px" : "0px",
                  opacity: dropdownOpen ? 1 : 0,
                  visibility: dropdownOpen ? "visible" : "hidden",
                  transform: dropdownOpen
                    ? "translateY(0)"
                    : "translateY(-8px)",
                  background: "#FFFFFF",
                  border: dropdownOpen
                    ? "1px solid #E1E3E5"
                    : "1px solid transparent",
                  borderRadius: "8px",
                  boxShadow: dropdownOpen
                    ? "0 4px 16px rgba(0,0,0,0.12)"
                    : "none",
                  zIndex: 10000,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  transition:
                    "max-height 250ms ease, opacity 200ms ease, transform 250ms ease, visibility 250ms ease",
                  pointerEvents: dropdownOpen ? "auto" : "none",
                }}
              >
                {/* SEARCH BAR - ONLY WHEN ENABLED */}
                {normalizedElement.selectWithSearch && (
                  <div
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #E1E3E5",
                    }}
                  >
                    <input
                      type="text"
                      value={dropdownSearch}
                      onChange={(event) =>
                        setDropdownSearch(event.target.value)
                      }
                      placeholder="Search options..."
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

                {/* OPTIONS */}
                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    padding: "4px",
                  }}
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                      const isSelected = value === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleDropdownSelect(option)}
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
                          <span
                            style={{
                              flex: 1,
                              fontSize: "13px",
                              color: "#303030",
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            {option.label}
                          </span>

                          {isSelected && (
                            <Icon source={PolarisIcons.CheckIcon} />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div style={{ padding: "14px", textAlign: "center" }}>
                      <Text as="p" variant="bodySm" tone="subdued">
                        No options found.
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
    // CHECKBOX
    // -------------------------------------------------------

    case "checkbox":
    case "checkboxes":
    case "checkbox_group": {
      const otherChecked = selected.includes("__other__");

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
                  const updated = isChecked
                    ? [...selected, option.value]
                    : selected.filter(
                      (selectedValue) => selectedValue !== option.value
                    );

                  setSelected(updated);
                  onChange?.(currentElement.id, updated);
                }}
              />
            ))}

            {/* OTHER CHECKBOX */}
            {normalizedElement.otherOption && (
              <Checkbox
                label={normalizedElement.otherLabel || "Other"}
                checked={otherChecked}
                disabled={isReadOnly}
                onChange={(isChecked) => {
                  const updated = isChecked
                    ? [...selected, "__other__"]
                    : selected.filter(
                      (selectedValue) => selectedValue !== "__other__"
                    );

                  setSelected(updated);

                  onChange?.(currentElement.id, {
                    value: updated,
                    otherValue: isChecked
                      ? otherValue
                      : "",
                  });

                  if (!isChecked) {
                    setOtherValue("");
                  }
                }}
              />
            )}
          </div>

          {/* OTHER TEXT FIELD */}
          {normalizedElement.otherOption && otherChecked && (
            <TextField
              placeholder={
                normalizedElement.otherPlaceholder || "Please specify"
              }
              value={otherValue}
              disabled={isReadOnly}
              onChange={(newValue) => {
                setOtherValue(newValue);

                onChange?.(currentElement.id, {
                  value: selected,
                  otherValue: newValue,
                });
              }}
              autoComplete="off"
            />
          )}

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // RADIO
    // -------------------------------------------------------

    case "radio":
    case "radio_button":
    case "radio_group": {
      const otherChecked = selected[0] === "__other__";

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
                  onChange={() => {
                    setSelected([option.value]);
                    setOtherValue("");
                    onChange?.(currentElement.id, option.value);
                  }}
                />

                <span>{option.label}</span>
              </label>
            ))}

            {normalizedElement.otherOption && (
              <label
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
                  value="__other__"
                  checked={otherChecked}
                  disabled={isReadOnly}
                  onChange={() => {
                    setSelected(["__other__"]);

                    onChange?.(currentElement.id, {
                      value: "__other__",
                      otherValue,
                    });
                  }}
                />

                <span>
                  {normalizedElement.otherLabel || "Other"}
                </span>
              </label>
            )}
          </div>

          {normalizedElement.otherOption && otherChecked && (
            <TextField
              placeholder={
                normalizedElement.otherPlaceholder || "Please specify"
              }
              value={otherValue}
              disabled={isReadOnly}
              onChange={(newValue) => {
                setOtherValue(newValue);

                onChange?.(currentElement.id, {
                  value: "__other__",
                  otherValue: newValue,
                });
              }}
              autoComplete="off"
            />
          )}

          {descriptionText}
        </BlockStack>
      );
    }

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
    case "button": {
      const buttonSelected = Array.isArray(selected)
        ? selected
        : selected
          ? [selected]
          : [];

      const otherChecked = buttonSelected.includes("__other__");

      const min = Number(normalizedElement.minSelections ?? 0);
      const max = Number(normalizedElement.maxSelections ?? 10);

      const limitEnabled =
        normalizedElement.multipleOptions &&
        normalizedElement.limitSelections;

      const handleButtonClick = (optionValue) => {
        let updated;

        if (normalizedElement.multipleOptions) {
          if (buttonSelected.includes(optionValue)) {
            updated = buttonSelected.filter((item) => item !== optionValue);
          } else {
            if (limitEnabled && buttonSelected.length >= max) {
              setError?.(`You can select a maximum of ${max} options.`);
              return;
            }

            updated = [...buttonSelected, optionValue];
          }
        } else {
          updated = [optionValue];
        }

        setSelected(updated);
        setError?.("");

        if (optionValue !== "__other__" || updated.includes("__other__")) {
          onChange?.(currentElement.id, updated);
        }

        if (!updated.includes("__other__")) {
          setOtherValue("");
        }
      };

      return (
        <BlockStack gap="200">
          <InlineStack gap="200" align="center">
            {(normalizedElement.options || []).map((option, index) => (
              <Button
                key={option.id || index}
                pressed={buttonSelected.includes(option.value)}
                disabled={isReadOnly}
                onClick={() => handleButtonClick(option.value)}
              >
                {option.label}
              </Button>
            ))}

            {normalizedElement.otherOption && (
              <Button
                pressed={otherChecked}
                disabled={isReadOnly}
                onClick={() => handleButtonClick("__other__")}
              >
                {normalizedElement.otherLabel || "Other"}
              </Button>
            )}
          </InlineStack>

          {normalizedElement.otherOption && otherChecked && (
            <TextField
              placeholder={normalizedElement.otherPlaceholder || "Please specify"}
              value={otherValue}
              disabled={isReadOnly}
              onChange={(newValue) => {
                setOtherValue(newValue);
                onChange?.(currentElement.id, {
                  value: buttonSelected,
                  otherValue: newValue,
                });
              }}
              autoComplete="off"
            />
          )}

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // URL
    // -------------------------------------------------------

    case "url":
      if (
        normalizedElement.limitCharacters &&
        normalizedElement.minCharacters !== "" &&
        value.length < Number(normalizedElement.minCharacters)
      ) {
        // Show minimum character validation error
      }
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <TextField
            {...commonTextFieldProps}
            label={undefined}
            type="url"
            placeholder={placeholder || "https://example.com"}
            value={value}
            onChange={setValue}
            autoComplete="url"
            readOnly={isReadOnly}
            maxLength={
              normalizedElement.limitCharacters &&
                normalizedElement.maxCharacters
                ? Number(normalizedElement.maxCharacters)
                : undefined
            }
          />
        </BlockStack>
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
    case "short_text": {
      const handleTextChange = (nextValue) => {
        let newValue = nextValue;

        // Allow numbers only
        if (normalizedElement.numbersOnly) {
          newValue = newValue.replace(/[^0-9]/g, "");
        }

        // Apply maximum character limit
        if (normalizedElement.enableCharacterLimit) {
          const maxLength = Number(normalizedElement.maxLength);

          if (maxLength > 0) {
            newValue = newValue.slice(0, maxLength);
          }
        }

        setValue(newValue);
      };

      return (
        <TextField
          {...commonTextFieldProps}
          value={value}
          onChange={handleTextChange}
          readOnly={isReadOnly}
        />
      );
    }

    // -------------------------------------------------------
    // TEXTAREA
    // -------------------------------------------------------

    case "textarea": {
      const handleTextareaChange = (nextValue) => {
        let newValue = nextValue;

        // Apply maximum character limit
        if (normalizedElement.limitCharacters) {
          const maxLength = Number(normalizedElement.maxCharacters);

          if (maxLength > 0) {
            newValue = newValue.slice(0, maxLength);
          }
        }

        setValue(newValue);
      };

      return (
        <BlockStack gap="100">
          <TextField
            {...commonTextFieldProps}
            multiline={3}
            value={value}
            onChange={handleTextareaChange}
            readOnly={isReadOnly}
          />

          {normalizedElement.limitCharacters && (
            <InlineStack align="end">
              <Text as="p" variant="bodySm" tone="subdued">
                {String(value || "").length}
                {normalizedElement.maxCharacters
                  ? ` / ${normalizedElement.maxCharacters}`
                  : ""} characters
              </Text>
            </InlineStack>
          )}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // NUMBER
    // -------------------------------------------------------

    case "number": {
      const min = normalizedElement.setMinValue
        ? Number(normalizedElement.minValue)
        : undefined;

      const max = normalizedElement.setMaxValue
        ? Number(normalizedElement.maxValue)
        : undefined;

      const handleNumberChangeWithLimits = (nextValue) => {
        if (nextValue === "") {
          setValue("");
          return;
        }

        const numericValue = Number(nextValue);

        if (!Number.isFinite(numericValue)) return;

        if (min !== undefined && numericValue < min) {
          setValue(String(min));
        } else if (max !== undefined && numericValue > max) {
          setValue(String(max));
        } else {
          setValue(nextValue);
        }
      };

      return (
        <TextField
          {...commonTextFieldProps}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleNumberChangeWithLimits}
          readOnly={isReadOnly}
          error={numberError || undefined}
        />
      );
    }

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
        if (isReadOnly || safeValue <= min) return;
        setValue(String(Math.max(min, safeValue - 1)));
      };

      const increaseValue = () => {
        if (isReadOnly || safeValue >= max) return;
        setValue(String(Math.min(max, safeValue + 1)));
      };

      return (
        <BlockStack gap="200">
          {/* Quantity selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              minHeight: "52px",
              padding: "0 12px",
              background: "#F6F6F7",
              border: "1px solid #E1E3E5",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          >
            {/* Decrease button */}
            <button
              type="button"
              disabled={isReadOnly || safeValue <= min}
              onClick={decreaseValue}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                color:
                  isReadOnly || safeValue <= min
                    ? "#C9CCCF"
                    : "#303030",
                fontSize: "22px",
                cursor:
                  isReadOnly || safeValue <= min
                    ? "not-allowed"
                    : "pointer",
                flexShrink: 0,
              }}
            >
              −
            </button>

            {/* Quantity label */}
            <span
              style={{
                flex: 1,
                minWidth: 0,
                marginLeft: "10px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#303030",
              }}
            >
              {label || "Quantity"}
            </span>

            {/* Current value */}
            <span
              style={{
                minWidth: "30px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 600,
                color: "#303030",
                marginRight: "10px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {safeValue}
            </span>

            {/* Increase button */}
            <button
              type="button"
              disabled={isReadOnly || safeValue >= max}
              onClick={increaseValue}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                color:
                  isReadOnly || safeValue >= max
                    ? "#C9CCCF"
                    : "#303030",
                fontSize: "22px",
                cursor:
                  isReadOnly || safeValue >= max
                    ? "not-allowed"
                    : "pointer",
                flexShrink: 0,
              }}
            >
              +
            </button>
          </div>

          {/* Description */}
          {normalizedElement.description && (
            <Text
              as="p"
              variant="bodySm"
              tone="subdued"
            >
              {normalizedElement.description}
            </Text>
          )}
        </BlockStack>
      );
    }


    // -------------------------------------------------------
    // REPEATER
    // -------------------------------------------------------


    case "repeater": {
      const minItems = Math.max(
        0,
        Number(normalizedElement.minItems ?? 1)
      );

      const maxItems = Math.max(
        minItems,
        Number(normalizedElement.maxItems ?? 5)
      );

      const addButtonText =
        normalizedElement.addButtonText || "Add more";

      const items = Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];

      const handleAddItem = () => {
        if (isReadOnly || items.length >= maxItems) return;

        setValue([...items, ""]);
      };

      const handleRemoveItem = (index) => {
        if (isReadOnly || items.length <= minItems) return;

        setValue(items.filter((_, i) => i !== index));
      };

      const handleItemChange = (index, newValue) => {
        const updatedItems = [...items];
        updatedItems[index] = newValue;
        setValue(updatedItems);
      };

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          {items.map((item, index) => (
            <InlineStack
              key={index}
              gap="200"
              blockAlign="center"
              wrap={false}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextField
                  label=""
                  labelHidden
                  placeholder={`${placeholder || "Enter value"} ${index + 1}`}
                  value={String(item ?? "")}
                  onChange={(newValue) =>
                    handleItemChange(index, newValue)
                  }
                  autoComplete="off"
                  readOnly={isReadOnly}
                />
              </div>

              {items.length > minItems && (
                <Button
                  icon={PolarisIcons.DeleteIcon}
                  variant="tertiary"
                  tone="critical"
                  disabled={isReadOnly}
                  onClick={() => handleRemoveItem(index)}
                />
              )}
            </InlineStack>
          ))}

          {items.length < maxItems && (
            <div>
              <Button
                variant="secondary"
                onClick={handleAddItem}
                disabled={isReadOnly}
                fullWidth={false}
              >
                {addButtonText}
              </Button>
            </div>
          )}

          <Text
            as="p"
            variant="bodySm"
            tone="subdued"
          >
            {items.length} / {maxItems} items
          </Text>
          {normalizedElement.description && (
            <Text as="p" variant="bodySm" tone="subdued">
              {normalizedElement.description}
            </Text>
          )}
        </BlockStack>
      );
    }


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

      const ratingColor =
        normalizedElement.ratingColor || "#2E4E49";

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
                gap: "clamp(4px, 2cqw, 10px)",
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
                      "--rating-active-color": ratingColor,
                      width: "100%",
                      aspectRatio: "1 / 1",
                      maxWidth: "100px",
                      minWidth: 0,
                      border: "none",
                      background: "transparent",
                      cursor: isReadOnly ? "default" : "pointer",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: star <= rating
                        ? ratingColor
                        : "#C9CCCF",
                      fontSize: "clamp(28px, 15cqw, 68px)",
                      lineHeight: 1,
                      boxSizing: "border-box",
                      overflow: "visible",
                      transition: "color 150ms ease, transform 150ms ease",
                    }}
                  >
                    {customRatingIcon ? (
                      <span
                        className="rating-custom-icon"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "inherit",
                        }}
                      >
                        <Icon source={customRatingIcon} />
                      </span>
                    ) : (
                      "★"
                    )}
                  </button>

                  {normalizedElement.showNumberUnderIcon && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#6D7175",
                      }}
                    >
                      {star}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {descriptionText}

          <style>
            {`
          .rating-star-button:hover:not(:disabled) {
            color: var(--rating-active-color) !important;
            transform: scale(1.08);
          }

          .rating-star-button:hover:not(:disabled)
          ~ .rating-star-button {
            color: inherit;
          }

          .rating-custom-icon .Polaris-Icon {
            width: 100% !important;
            height: 100% !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .rating-custom-icon .Polaris-Icon svg {
            width: 100% !important;
            height: 100% !important;
            max-width: 68px;
            max-height: 68px;
            display: block;
          }

          .rating-custom-icon svg {
            color: inherit;
          }
        `}
          </style>
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

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttribute || undefined}
            multiple={Boolean(normalizedElement.allowMultiple)}
            onChange={handleFileSelection}
            style={{ display: "none" }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
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
              cursor: "pointer",
            }}
          >
            <Text as="p" variant="bodyMd">
              {filePlaceholder}
            </Text>

            <Text as="p" variant="bodySm" tone="subdued">
              {acceptedFileTypes.length > 0
                ? `Supported formats: ${acceptedFileTypes.join(", ").toUpperCase()}`
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

          {fileError && (
            <Text as="p" variant="bodySm" tone="critical">
              {fileError}
            </Text>
          )}

          {selectedFiles.length > 0 && (
            <BlockStack gap="100">
              {selectedFiles.map((file, index) => (
                <InlineStack key={`${file.name}-${index}`} align="space-between">
                  <Text as="span" variant="bodySm">
                    {file.name}
                  </Text>

                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={() =>
                      setSelectedFiles((previous) =>
                        previous.filter((_, fileIndex) => fileIndex !== index)
                      )
                    }
                  >
                    Remove
                  </Button>
                </InlineStack>
              ))}
            </BlockStack>
          )}

          {descriptionText}
        </BlockStack>
      );
    }

    // -------------------------------------------------------
    // IMAGE OPTIONS
    // -------------------------------------------------------


    case "image_options": {
      const maxImages = Math.max(
        1,
        Number(normalizedElement.maxImages) || 5
      );

      const selectedImages = Array.isArray(imagePreview)
        ? imagePreview
        : imagePreview
          ? [imagePreview]
          : [];

      const remainingImages = Math.max(
        0,
        maxImages - selectedImages.length
      );

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
              gap: "12px",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            {/* IMAGE PREVIEWS */}
            {selectedImages.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "10px",
                }}
              >
                {selectedImages.map((image, index) => (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      minWidth: 0,
                    }}
                  >
                    <img
                      src={image}
                      alt={`Selected image ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        display: "block",
                      }}
                    />

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedImages = selectedImages.filter(
                            (_, imageIndex) => imageIndex !== index
                          );

                          setImagePreview(updatedImages);
                          onChange?.(currentElement.id, updatedImages);
                        }}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "23px",
                          height: "23px",
                          border: "none",
                          borderRadius: "50%",
                          background: "#ffffff",
                          cursor: "pointer",
                          fontSize: "15px",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedImages.length === 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "90px",
                }}
              >
                <Text as="p" variant="bodyMd">
                  {normalizedElement.placeholder || "Choose images"}
                </Text>
              </div>
            )}

            {/* UPLOAD BUTTON */}
            {!isReadOnly && remainingImages > 0 && (
              <label
                style={{
                  padding: "9px 14px",
                  border: "1px solid #8c9196",
                  borderRadius: "5px",
                  color: "#303030",
                  fontSize: "14px",
                  background: "#ffffff",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {selectedImages.length > 0
                  ? "Add more images"
                  : "Browse images"}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);

                    const validFiles = files.filter((file) =>
                      file.type.startsWith("image/")
                    );

                    const allowedFiles = validFiles.slice(
                      0,
                      remainingImages
                    );

                    const newImages = allowedFiles.map((file) =>
                      URL.createObjectURL(file)
                    );

                    const updatedImages = [
                      ...selectedImages,
                      ...newImages,
                    ];

                    setImagePreview(updatedImages);
                    onChange?.(currentElement.id, updatedImages);

                    event.target.value = "";
                  }}
                />
              </label>
            )}

            <Text
              as="p"
              variant="bodySm"
              tone="subdued"
              alignment="center"
            >
              {selectedImages.length} / {maxImages} images selected
            </Text>
          </div>

          {descriptionText}
        </BlockStack>
      );
    }


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
            onChange={(event) => {
              const newValue = Number(event.target.value);
              setRangeValue(newValue);
              onChange?.(currentElement.id, newValue);
            }}
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
      const normalizeMatrixItems = (list, fallback, prefix) => {
        const source = Array.isArray(list) && list.length
          ? list
          : fallback;

        return source.map((item, index) => {
          if (typeof item === "string") {
            return {
              label: item,
              value: item,
            };
          }

          return {
            label: item?.label ?? `${prefix} ${index + 1}`,
            value: item?.value ?? item?.label ?? `${prefix} ${index + 1}`,
          };
        });
      };

      // New settings names with backward compatibility
      const matrixQuestions = normalizeMatrixItems(
        normalizedElement.questions ?? normalizedElement.rows,
        [
          "How likely are you to watch movies?",
          "How likely are you to listen to music?",
        ],
        "Question"
      );

      const matrixAnswers = normalizeMatrixItems(
        normalizedElement.answers ?? normalizedElement.columns,
        ["Rarely", "Seldom", "Often", "Always"],
        "Answer"
      );

      const allowMultiple = Boolean(normalizedElement.allowMultiple);

      const selectedValues = Array.isArray(selected)
        ? selected
        : selected
          ? [selected]
          : [];

      const getQuestionPrefix = (question) =>
        `${question.value}::`;

      const getAnswerValue = (question, answer) =>
        `${question.value}::${answer.value}`;

      const isAnswerSelected = (question, answer) =>
        selectedValues.includes(getAnswerValue(question, answer));

      const handleMatrixSelection = (question, answer) => {
        if (isReadOnly) return;

        const questionPrefix = getQuestionPrefix(question);
        const answerValue = getAnswerValue(question, answer);

        setSelected((previous) => {
          const previousValues = Array.isArray(previous)
            ? previous
            : previous
              ? [previous]
              : [];

          const alreadySelected = previousValues.includes(answerValue);

          if (allowMultiple) {
            if (alreadySelected) {
              return previousValues.filter(
                (item) => item !== answerValue
              );
            }

            return [...previousValues, answerValue];
          }

          return [
            ...previousValues.filter(
              (item) =>
                !String(item).startsWith(questionPrefix)
            ),
            answerValue,
          ];
        });
      };

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div
            style={{
              width: "100%",
              minWidth: 0,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              border: "1px solid #E1E3E5",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: `${Math.max(420, 150 + matrixAnswers.length * 90)}px`,
                borderCollapse: "collapse",
                tableLayout: "auto",
                fontSize: "13px",
                background: "#FFFFFF",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F6F6F7",
                    borderBottom: "1px solid #E1E3E5",
                  }}
                >
                  <th
                    scope="col"
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      minWidth: "150px",
                      color: "#303030",
                    }}
                  >
                    Questions
                  </th>

                  {matrixAnswers.map((answer, index) => (
                    <th
                      key={`matrix-answer-${index}`}
                      scope="col"
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        fontWeight: 600,
                        color: "#303030",
                        minWidth: "85px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {answer.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {matrixQuestions.map((question, questionIndex) => (
                  <tr
                    key={`matrix-question-${questionIndex}`}
                    style={{
                      borderBottom:
                        questionIndex !== matrixQuestions.length - 1
                          ? "1px solid #E1E3E5"
                          : "none",
                      background:
                        questionIndex % 2 === 0
                          ? "#FFFFFF"
                          : "#FAFAFA",
                    }}
                  >
                    <th
                      scope="row"
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 500,
                        color: "#303030",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {question.label}
                    </th>

                    {matrixAnswers.map((answer, answerIndex) => {
                      const checked = isAnswerSelected(
                        question,
                        answer
                      );

                      return (
                        <td
                          key={`matrix-cell-${questionIndex}-${answerIndex}`}
                          style={{
                            padding: "12px 8px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type={allowMultiple ? "checkbox" : "radio"}
                            name={
                              `matrix-${normalizedElement.id || "field"}-${questionIndex}`
                            }
                            value={answer.value}
                            checked={checked}
                            disabled={isReadOnly}
                            required={
                              !allowMultiple &&
                              Boolean(required) &&
                              matrixAnswers.length > 0
                            }
                            aria-label={`${question.label}: ${answer.label}`}
                            onChange={() =>
                              handleMatrixSelection(question, answer)
                            }
                            style={{
                              width: "17px",
                              height: "17px",
                              margin: 0,
                              accentColor: "#303030",
                              cursor: isReadOnly
                                ? "default"
                                : "pointer",
                              verticalAlign: "middle",
                            }}
                          />
                        </td>
                      );
                    })}
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

      const showOptionLabel =
        normalizedElement.showOptionLabel !== false;

      const selectedImageOption = imageOptions.find(
        (option) =>
          (option.value || option.label) === value
      );

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
              position: "relative",
              width: "100%",
            }}
          >

            {/* DROPDOWN BUTTON */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() =>
                setImageDropdownOpen((prev) => !prev)
              }
              style={{
                width: "100%",
                minHeight: "42px",
                padding: "10px 12px",
                border: "1px solid #8c9196",
                borderRadius: "8px",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: isReadOnly ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <span>
                {selectedImageOption?.label || "Select an option"}
              </span>

              <span
                style={{
                  transform: imageDropdownOpen
                    ? "rotate(180deg)"
                    : "rotate(0)",
                  transition: "transform 0.2s",
                }}
              >
                ▼
              </span>
            </button>

            {/* DROPDOWN OPTIONS */}
            {imageDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 5px)",
                  left: 0,
                  right: 0,
                  zIndex: 10000,
                  background: "#fff",
                  border: "1px solid #d2d5d8",
                  borderRadius: "8px",
                  padding: "12px",
                  maxHeight: "260px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
              >
                {imageOptions.map((option, index) => {
                  const optionValue =
                    option.value || option.label;

                  const isSelected = value === optionValue;

                  return (
                    <div
                      key={option.id || optionValue || index}
                      onClick={() => {
                        if (!isReadOnly) {
                          setValue(optionValue);
                          onChange?.(currentElement.id, optionValue);
                          setImageDropdownOpen(false);
                        }
                      }}
                      style={{
                        cursor: isReadOnly ? "default" : "pointer",
                        padding: "6px",
                        borderRadius: "7px",
                        border: isSelected
                          ? "2px solid #303030"
                          : "1px solid #e1e3e5",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        background: isSelected ? "#f6f6f7" : "#fff",
                        minWidth: 0,
                      }}
                    >
                      <img
                        src={option.image}
                        alt={option.label || ""}
                        style={{
                          width: "100%",
                          height: "75px",
                          objectFit: "cover",
                          borderRadius: "5px",
                          display: "block",
                        }}
                      />

                      {showOptionLabel && (
                        <div
                          style={{
                            fontSize: "12px",
                            textAlign: "center",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {option.label}
                        </div>
                      )}
                    </div>
                  );
                })}

                {imageOptions.length === 0 && (
                  <Text as="p" tone="subdued">
                    No image options available.
                  </Text>
                )}
              </div>
            )}
          </div>
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
