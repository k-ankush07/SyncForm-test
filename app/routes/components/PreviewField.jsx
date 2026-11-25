import React, { useEffect, useState, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "flatpickr/dist/plugins/monthSelect/style.css";
import "flag-icons/css/flag-icons.min.css";
import PreviewTextInput from "./PreviewTextInput";
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
// imports hooks 
import useFieldValue from "../../utils/hooks/useFieldValue.js";
import usePhoneField from "../../utils/hooks/usePhoneField.js";
import usePasswordField from "../../utils/hooks/usePasswordField.js";
import useChoiceField from "../../utils/hooks/useChoiceField.js";
import useCountryField from "../../utils/hooks/useCountryField.js";
import useDateField from "../../utils/hooks/useDateField.js";
import useFileField from "../../utils/hooks/useFileField.js";
import useEmailField from "../../utils/hooks/useEmailField.js";
import useRepeaterField from "../../utils/hooks/useRepeaterField.js";
import useBooleanField from "../../utils/hooks/useBooleanField.js";
import useRangeField from "../../utils/hooks/useRangeField.js";
import useRatingField from "../../utils/hooks/useRatingField.js";
import useColorField from "../../utils/hooks/useColorField.js";
import useNameField from "../../utils/hooks/useNameField.js";
import useQuantityField from "../../utils/hooks/useQuantityField.js";
import useNumberField from "../../utils/hooks/useNumberField.js";
import useTextField from "../../utils/hooks/useTextField.js";
import useDropdownField from "../../utils/hooks/useDropdownField";
import useProductField from "../../utils/hooks/useProductField";
import useImageDropdownField from "../../utils/hooks/useImageDropdownField";
// 1. SIGNATURE PREVIEW
import SignaturePreview from "../../utils/SignaturePreview.jsx";



// =============================================================
// 1. REUSABLE FLATPICKR FIELD
// =============================================================

function FlatpickrField({
  value = "",
  options = {},
  onChange,
  placeholder = "",
  className = "",
}) {
  const inputRef = useRef(null);
  const instanceRef = useRef(null);

  // Keep the latest props available to Flatpickr callbacks.
  const optionsRef = useRef(options);
  const onChangeRef = useRef(onChange);

  optionsRef.current = options;
  onChangeRef.current = onChange;

  // Initialize Flatpickr once.
  useEffect(() => {
    const input = inputRef.current;

    if (!input) return;

    // Remove any previous instance attached to this input.
    if (
      input._flatpickr &&
      typeof input._flatpickr.destroy === "function"
    ) {
      input._flatpickr.destroy();
    }

    const instance = flatpickr(input, {
      ...optionsRef.current,
      clickOpens: true,
      disableMobile: true,

      onChange: (selectedDates, dateString) => {
        onChangeRef.current?.(dateString, selectedDates);
      },
    });

    const flatpickrInstance = input._flatpickr || instance;

    if (
      !flatpickrInstance ||
      typeof flatpickrInstance.destroy !== "function"
    ) {
      console.error("Flatpickr initialization failed.");
      return;
    }

    instanceRef.current = flatpickrInstance;

    return () => {
      if (
        input._flatpickr === flatpickrInstance &&
        typeof flatpickrInstance.destroy === "function"
      ) {
        flatpickrInstance.destroy();
      }

      instanceRef.current = null;
    };
  }, []);

  // Update options when the parent changes picker settings.
  useEffect(() => {
    const instance = instanceRef.current;

    if (!instance || typeof instance.set !== "function") return;

    Object.entries(options).forEach(([key, optionValue]) => {
      if (
        key === "onChange" ||
        key === "onReady" ||
        key === "plugins"
      ) {
        return;
      }

      try {
        instance.set(key, optionValue);
      } catch (error) {
        console.warn(
          `Could not update Flatpickr option: ${key}`,
          error
        );
      }
    });
  }, [options]);

  // Restore or update the displayed date.
  useEffect(() => {
    const instance = instanceRef.current;

    if (!instance || typeof instance.setDate !== "function") return;

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      instance.clear(false);
      return;
    }

    // Avoid passing a time-only value to a date-only picker.
    const isDateOnly =
      optionsRef.current.enableTime === false &&
      optionsRef.current.noCalendar !== true;

    if (
      isDateOnly &&
      typeof value === "string" &&
      /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(value.trim())
    ) {
      console.warn(
        "Date-only picker received a time-only value:",
        value
      );

      instance.clear(false);
      return;
    }

    instance.setDate(value, false);
  }, [value]);

  // Open the picker when the input is clicked.
  const openPicker = () => {
    const input = inputRef.current;
    const instance = input?._flatpickr || instanceRef.current;

    if (!instance || typeof instance.open !== "function") {
      console.error("Flatpickr instance is missing or invalid.");
      return;
    }

    instance.open();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      readOnly
      placeholder={placeholder}
      className={className}
      onClick={openPicker}
    />
  );
}
// =====================================================================
// REUSABLE TEXT INPUT SHELL
// ---------------------------------------------------------------------
// Gives text-based fields the same appearance as the phone field:
// left icon + divider + input.
// =====================================================================

function PreviewInputShell({
  label,
  required,
  hideLabel = false,
  icon,
  description,
  children,
  className = "",
  style = {},
  inputStyle = {},
  iconStyle = {},
  labelStyle = {},
  labelVariant = "bodyMd",
}) {
  return (
    <BlockStack gap="200">
      {/* COMMON LABEL */}
      {!hideLabel && label && (
        <Text as="label" variant={labelVariant}>
          <span style={labelStyle}>
            {label}
            {required && (
              <span style={{ color: "var(--p-color-text-critical)" }}>
                {" "}*
              </span>
            )}
          </span>
        </Text>
      )}

      {/* COMMON INPUT SHELL */}
      <div
        className={`preview-input-shell ${className}`}
        style={{
          display: "flex",
          width: "100%",
          minWidth: 0,
          alignItems: "stretch",
          background: "#F6F6F7",
          borderRadius: "8px",
          boxSizing: "border-box",
          overflow: "hidden",
          ...style,
        }}
      >
        {/* COMMON ICON */}
        {icon && (
          <div
            className="preview-input-shell__icon"
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
              ...iconStyle,
            }}
          >
            <Icon source={icon} />
          </div>
        )}

        {/* INPUT CONTENT */}
        <div
          className="preview-input-shell__content"
          style={{
            flex: 1,
            minWidth: 0,
            ...inputStyle,
          }}
        >
          {children}
        </div>
      </div>

      {/* COMMON DESCRIPTION */}
      {description && description}
    </BlockStack>
  );
}
// =============================================================
// 3. MAIN PREVIEW FIELD COMPONENT
// =============================================================

// one common function to get all min max value 
const getCharacterLimits = (element) => {
  return {
    minLength:
      element.limitCharacters && element.minCharacters !== ""
        ? Number(element.minCharacters)
        : undefined,

    maxLength:
      element.limitCharacters && element.maxCharacters !== ""
        ? Number(element.maxCharacters)
        : undefined,
  };
};
// ===========================================================
// SHARED FIELD VALIDATION HELPERS
// ===========================================================

// Check whether the complete value is a valid name.
const isValidName = (value) => {
  return /^[\p{L}\p{M}\s'.-]+$/u.test(value);
};

// // Remove invalid name characters.
// const filterNameCharacters = (value) => {
//   return value.replace(/[^\p{L}\p{M}\s'.-]/gu, "");
// };

// Keep numeric characters only.
const filterNumbersOnly = (value) => {
  return value.replace(/[^0-9]/g, "");
};

export default function PreviewField({
  element,
  field,
  savedValue,
  pages = [],
  onChange,
  activePageId = null,
  products = [],
  isModelPreview = false,
  productsLoading = false,

  // Footer navigation actions.
  onPrevious,
  onNext,
  onReset,
  onSubmit,
  isFirstCustomerPage = true,
  isLastCustomerPage = false,
  // Validation error from parent.
  //error,
}) {
  // ===========================================================
  // 3.1 NORMALIZE THE CURRENT ELEMENT
  // ===========================================================

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

  const rawOptions = Array.isArray(normalizedElement.options)
    ? normalizedElement.options
    : [];
  // In editor mode fields are read-only.
  // In customer/model preview mode fields can be filled in.
  const isReadOnly = !isModelPreview;

  // Count visible customer pages.
  const customerPageCount = pages.filter(
    (page) => page.visible !== false
  ).length;

  const hasMultiplePages = customerPageCount > 1;

  // ===========================================================
  // 3.2 PARENT VALUE HANDLERS
  // ===========================================================
  const usesSelection = [
    "checkbox",
    "checkboxes",
    "checkbox_group",
    "radio",
    "radio_button",
    "radio_group",
    "button",
    "feedback",
    "matrix",
    "product",
  ].includes(type);

  const {
    value,
    setValue,
    reportChange,
    updateValue,
    selected,
    setSelected,
    otherValue,
    setOtherValue,
  } = useFieldValue({
    savedValue,
    defaultValue,
    fieldId: currentElement?.id,
    onChange,
    normalizedElement,
    enableSelection: usesSelection,
  });


  const {
    // Choice
    options,
    selectedValues,
    optionsPerLine,
    choiceGridStyle,
    checkboxGridStyle,
    otherChecked,
    isMaxReached,

    handleCheckboxChange,
    handleRadioChange,
    handleCheckboxOtherChange,
    handleRadioOtherChange,
    handleOtherTextChange,

    // Matrix
    matrixQuestions,
    matrixAnswers,
    matrixAllowMultiple,
    getAnswerValue,
    isAnswerSelected,
    handleMatrixSelection,

    // Feedback
    feedbackEmojis,
    feedbackAllowMultiple,
    handleFeedbackSelection,
  } = useChoiceField({
    selected,
    setSelected,
    otherValue,
    setOtherValue,
    reportChange,
    normalizedElement,
    maxSelections: Number(normalizedElement.maxSelections) || 0,
    isReadOnly,
  });

  // show the name error 
  const {
    nameError,
    handleNameChange,
  } = useNameField({
    normalizedElement,
    updateValue,
    isValidName,
    filterNumbersOnly,
  });

  // show the number error get from this 
  const {
    numberError,
    handleNumberChangeWithLimits,
  } = useNumberField({
    normalizedElement,
    updateValue,
  });


  // Dropdown and image dropdown 
  const {
    dropdownOpen,
    setDropdownOpen,
    dropdownSearch,
    setDropdownSearch,
    selectedOption,
    filteredOptions,
    handleDropdownSelect,
  } = useDropdownField({
    normalizedElement,
    value,
    updateValue,
  });

  const {
    imageOptions,
    selectedImageOption,
    imageDropdownOpen,
    setImageDropdownOpen,
    handleImageDropdownSelect,
  } = useImageDropdownField({
    normalizedElement,
    rawOptions,
    value,
    updateValue,
    isReadOnly,
  });
  // ===========================================================
  // 3.5 CONSENT STATE
  // ===========================================================
  const {
    checked,
    setChecked,
    switchValue,
    setSwitchValue,
    handleSwitchChange,
  } = useBooleanField({
    savedValue,
    normalizedElement,
    type,
    reportChange,
  });

  // ===========================================================
  // 3.6 PASSWORD AND EMAIL CONFIRMATION STATE
  // ===========================================================
  const {
    confirmPasswordValue,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordValidationTriggered,
    setPasswordValidationTriggered,
    handlePasswordChange,
    handleConfirmPasswordChange,
    passwordError,
    confirmPasswordError,
  } = usePasswordField({
    savedValue,
    fieldId: normalizedElement.id,
    value,
    setValue,
    reportChange,
    normalizedElement,
    required,
    label,
  });
  //email 
  const {
    confirmEmailValue,
    handleEmailChange,
    handleConfirmEmailChange,
  } = useEmailField({
    savedValue,
    normalizedElement,
    value,
    setValue,
    reportChange,
  });
  // ===========================================================
  // 3.7 PHONE STATE
  // ===========================================================

  const {
    phoneCountry,
    setPhoneCountry,
    countryDropdownOpen,
    setCountryDropdownOpen,
    phoneCountryList,
    currentPhoneCountry,
    showPhoneCountry,
    reportPhoneValue,
    handlePhoneCountryChange,
    handlePhoneChange,
  } = usePhoneField({
    savedValue,
    normalizedElement,
    type,
    value,
    setValue,
    reportChange,
    phoneCountryList: countries,
  });
  // ===========================================================
  // COUNTRY FIELD
  // ===========================================================

  const {
    countrySearch,
    setCountrySearch,
    selectedCountry,
    isCountryDropdownOpen,
    setIsCountryDropdownOpen,
    handleCountrySelect,
  } = useCountryField({
    savedValue,
    normalizedElement,
    updateValue,
  });

  // products 
  const {
    selectedProductIds,
    filteredProducts,
    showSearch,
    handleProductSelect,
  } = useProductField({
    normalizedElement,
    products,
    value,
    selected,
    setSelected,
    reportChange,
  });

  // ===========================================================
  // 3.9 DATE AND TIME STATE
  // ===========================================================
  const {
    dateValue,
    updateDateValue,
    dateOnlyValue,
    timeOnlyValue,
    datePickerOptions,
    dateTimePickerOptions,
    timePickerOptions,
    timeOptions,
    dateError,
    validateDate,
    format,
    timeType,
    onlyShowMonth,
  } = useDateField({
    savedValue,
    normalizedElement,
    reportChange,
  });

  // ===========================================================
  // 3.10 FILE STATE
  // ===========================================================

  const {
    selectedFiles,
    fileInputRef,
    fileError,
    acceptedFileTypes,
    acceptAttribute,
    handleFileSelection,
    handleFileRemove,
  } = useFileField({
    savedValue,
    normalizedElement,
    reportChange,
  });

  // ===========================================================
  // 3.11 RATING AND RANGE STATE
  // ===========================================================
  // ===========================================================
  // 3.11 RATING AND RANGE STATE
  // ===========================================================
  const {
    rating,
    maxLevel,
    ratingLevels,
    ratingStars,
    customRatingIcon,
    ratingColor,
    showNumberUnderIcon,
    lowLabel,
    highLabel,
    handleRatingChange,
  } = useRatingField({
    savedValue,
    normalizedElement,
    reportChange,
  });
  //range 
  const {
    rangeValue,
    rangeMin,
    rangeMax,
    rangeStep,
    showRangeValue,
    handleRangeChange,
  } = useRangeField({
    savedValue,
    normalizedElement,
    reportChange,
  });

  // ===========================================================
  // 3.13 COLOR STATE
  // ===========================================================
  const {
    colorValue,
    handleColorChange,
  } = useColorField({
    savedValue,
    normalizedElement,
    reportChange,
  });

  //Quantity 
  const {
    min: quantityMin,
    max: quantityMax,
    safeValue,
    increaseValue,
    decreaseValue,
  } = useQuantityField({
    value,
    normalizedElement,
    updateValue,
    isReadOnly,
  });

  // for text and text field both 
  const {
    handleTextChange,
    characterCount,
    maxLength: textFieldMaxLength,
    hasCharacterLimit: textFieldHasCharacterLimit,
  } = useTextField({
    normalizedElement,
    value,
    setValue,
    reportChange,
    fieldType: type,
  });
  // ===========================================================
  // REPEATER STATE
  // ===========================================================

  const {
    items: repeaterItems,
    minItems,
    maxItems,
    hasMinItemsError,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
  } = useRepeaterField({
    savedValue,
    normalizedElement,
    reportChange,
    isReadOnly,
  });

  // ===========================================================
  // 10. LABEL, ICON AND COMMON FIELD PROPS
  // ===========================================================

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
        <span style={{ color: "var(--p-color-text-critical)" }}>
          *
        </span>
      )}
    </div>
  );

  const descriptionText = description ? (
    <Text as="p" variant="bodySm" tone="subdued">
      {description}
    </Text>
  ) : null;

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

  // ===========================================================
  // 11. HTML SANITIZATION
  // ===========================================================

  const sanitizeHTML = (html) => {
    if (typeof window === "undefined") {
      return html;
    }

    const purifier = createDOMPurify(window);

    return purifier.sanitize(html);
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
    case "email": {
      const { minLength, maxLength } =
        getCharacterLimits(normalizedElement);

      return (
        <BlockStack gap="300">
          {/* MAIN EMAIL FIELD */}
          <PreviewInputShell
            label={label}
            required={required}
            icon={selectedIcon}
            hideLabel={hideLabel}
            description={descriptionText}
          >
            <PreviewTextInput
              type="email"
              autoComplete="email"
              value={value}
              onChange={handleEmailChange}
              placeholder={placeholder}
              readOnly={isReadOnly}
              disabled={isReadOnly}
              minLength={minLength}
              maxLength={maxLength}
            />
          </PreviewInputShell>

          {/* CONFIRM EMAIL FIELD */}
          {normalizedElement.confirmEmail && (
            <PreviewInputShell
              label={normalizedElement.confirmEmailLabel || "Confirm email"}
              required={required}
              icon={selectedIcon}
              description={
                normalizedElement.confirmEmailDescription || undefined
              }
            >
              <PreviewTextInput
                type="email"
                autoComplete="email"
                value={confirmEmailValue}
                onChange={handleConfirmEmailChange}
                placeholder={
                  normalizedElement.confirmEmailPlaceholder ||
                  "Confirm your email"
                }
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </PreviewInputShell>
          )}
        </BlockStack>
      );
    }
    // -------------------------------------------------------
    // NAME
    // -------------------------------------------------------
    case "name":
    case "first_name":
    case "last_name": {
      const { minLength, maxLength } =
        getCharacterLimits(normalizedElement);
      return (
        <PreviewInputShell
          label={label}
          required={required}
          hideLabel={hideLabel}
          icon={selectedIcon}
          description={descriptionText}
        >

          <PreviewTextInput
            value={value}
            onChange={handleNameChange}
            autoComplete="given-name"
            placeholder={placeholder}
            readOnly={isReadOnly}
            error={nameError || undefined}
            minLength={minLength}
            maxLength={maxLength}
          />

        </PreviewInputShell>
      );
    }
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
                value={value}
                onChange={handlePhoneChange}
                placeholder={placeholder}
                autoComplete="tel"
                label=""
                labelHidden
                disabled={isReadOnly}
                requiredIndicator={false}
                error={undefined}
                borderless
              />
            </div>
          </div>

          {descriptionText}
        </BlockStack>
      )
    // -------------------------------------------------------
    // PASSWORD
    // -------------------------------------------------------
    case "password": {
      const { minLength, maxLength } =
        getCharacterLimits(normalizedElement);

      const passwordSuffix = (
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="password-visibility-button"
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

      const confirmPasswordSuffix = (
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
        >
          <Icon
            source={
              showConfirmPassword
                ? PolarisIcons.HideIcon
                : PolarisIcons.ViewIcon
            }
          />
        </button>
      );

      return (
        <BlockStack gap="300">
          {/* MAIN PASSWORD */}
          <PreviewInputShell
            label={label}
            required={required}
            icon={selectedIcon}
            description={descriptionText}
          >
            <PreviewTextInput
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={value}
              onChange={handlePasswordChange}
              placeholder={placeholder}
              readOnly={isReadOnly}
              disabled={isReadOnly}
              error={passwordError || undefined}
              minLength={minLength}
              maxLength={maxLength}
              suffix={passwordSuffix}
            />
          </PreviewInputShell>

          {/* CONFIRM PASSWORD */}
          {normalizedElement.confirmPassword && (
            <PreviewInputShell
              label={
                normalizedElement.hideLabel
                  ? ""
                  : normalizedElement.confirmPasswordLabel ||
                  "Confirm Password"
              }
              required={required}
              icon={selectedIcon}
              description={
                normalizedElement.confirmPasswordDescription || undefined
              }
            >
              <PreviewTextInput
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPasswordValue}
                onChange={handleConfirmPasswordChange}
                placeholder={
                  normalizedElement.confirmPasswordPlaceholder ||
                  "Confirm your password"
                }
                readOnly={isReadOnly}
                disabled={isReadOnly}
                error={confirmPasswordError || undefined}
                minLength={minLength}
                maxLength={maxLength}
                suffix={confirmPasswordSuffix}
              />
            </PreviewInputShell>
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

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={{ position: "relative", width: "100%" }}>
            {/* SELECTED COUNTRY / DROPDOWN BUTTON */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() =>
                setIsCountryDropdownOpen((previous) => !previous)
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
                  transform: isCountryDropdownOpen
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
                  maxHeight: isCountryDropdownOpen ? "280px" : "0px",
                  opacity: isCountryDropdownOpen ? 1 : 0,
                  visibility: isCountryDropdownOpen
                    ? "visible"
                    : "hidden",
                  transform: isCountryDropdownOpen
                    ? "translateY(0)"
                    : "translateY(-8px)",
                  background: "#FFFFFF",
                  border: isCountryDropdownOpen
                    ? "1px solid #E1E3E5"
                    : "1px solid transparent",
                  borderRadius: "8px",
                  boxShadow: isCountryDropdownOpen
                    ? "0 4px 16px rgba(0,0,0,0.12)"
                    : "none",
                  zIndex: 10000,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  transition:
                    "max-height 250ms ease, opacity 200ms ease, transform 250ms ease, visibility 250ms ease, border-color 250ms ease",
                  pointerEvents: isCountryDropdownOpen ? "auto" : "none",
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
      // =====================================================
      // 1. GET SELECTED ICON
      // =====================================================

      const selectedIconName =
        normalizedElement.selectIcon ||
        normalizedElement.settings?.selectIcon ||
        element?.selectIcon ||
        element?.settings?.selectIcon ||
        "";

      const selectedIcon = selectedIconName
        ? PolarisIcons[selectedIconName]
        : null;

      // =====================================================
      // 2. FIELD LABEL WITH PROPER ICON ALIGNMENT
      // =====================================================

      const dropdownLabelWithIcon = (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "7px",
            width: "100%",
            minHeight: "20px",
          }}
        >
          {selectedIcon && (
            <span
              style={{
                width: "20px",
                minWidth: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon source={selectedIcon} />
            </span>
          )}

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "14px",
              lineHeight: "20px",
              color: "#303030",
            }}
          >
            {label}

            {required && (
              <span
                style={{
                  color: "#D72C0D",
                  lineHeight: "20px",
                }}
              >
                *
              </span>
            )}
          </span>
        </div>
      );

      // =====================================================
      // 3. RENDER DROPDOWN
      // =====================================================

      return (
        <BlockStack gap="200">
          {dropdownLabelWithIcon}

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
                setDropdownOpen((previous) => !previous)
              }
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

              {/* ARROW ICON */}

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
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
                {/* SEARCH BAR */}

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

                {/* OPTIONS LIST */}

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
                          onClick={() =>
                            handleDropdownSelect(option)
                          }
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
                        No options found.
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}

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
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={checkboxGridStyle}>
            {options.map((option) => {
              const isChecked = selectedValues.includes(option.value);

              return (
                <Checkbox
                  key={option.value}
                  label={option.label}
                  checked={isChecked}
                  disabled={isReadOnly || (!isChecked && isMaxReached)}
                  onChange={(checked) =>
                    handleCheckboxChange(option.value, checked)
                  }
                />
              );
            })}
          </div>

          {normalizedElement.otherOption && otherChecked && (
            <TextField
              placeholder={
                normalizedElement.otherPlaceholder || "Please specify"
              }
              value={otherValue}
              disabled={isReadOnly}
              onChange={(newValue) => handleOtherTextChange(newValue)}
              autoComplete="off"
            />
          )}

          {descriptionText}
        </BlockStack>
      );
    }
    // RADIO
    // -------------------------------------------------------
    case "radio":
    case "radio_button":
    case "radio_group": {
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
                  checked={selectedValues[0] === option.value}
                  disabled={isReadOnly}
                  onChange={() => handleRadioChange(option.value)}
                />

                <span>{option.label}</span>
              </label>
            ))}

            {/* OTHER RADIO */}
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
                  onChange={handleRadioOtherChange}
                />

                <span>
                  {normalizedElement.otherLabel || "Other"}
                </span>
              </label>
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
              onChange={(newValue) =>
                handleOtherTextChange(newValue, true)
              }
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
            onChange={(isChecked) => {
              setChecked(isChecked);
              reportChange(isChecked);
            }}
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

      const max = Number(normalizedElement.maxSelections ?? 10);

      const limitEnabled =
        normalizedElement.multipleOptions &&
        normalizedElement.limitSelections;

      const handleButtonClick = (optionValue) => {
        let updated;

        if (normalizedElement.multipleOptions) {
          if (buttonSelected.includes(optionValue)) {
            updated = buttonSelected.filter(
              (item) => item !== optionValue
            );
          } else {
            if (limitEnabled && buttonSelected.length >= max) {
              return;
            }

            updated = [...buttonSelected, optionValue];
          }
        } else {
          updated = [optionValue];
        }

        setSelected(updated);

        if (updated.includes("__other__")) {
          reportChange({
            value: updated,
            otherValue: otherValue,
          });
        } else {
          reportChange(updated);
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
              placeholder={
                normalizedElement.otherPlaceholder || "Please specify"
              }
              value={otherValue}
              disabled={isReadOnly}
              onChange={(newValue) => {
                setOtherValue(newValue);

                reportChange({
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
        // Minimum character validation will be handled
        // by the central form validation system.
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
            onChange={updateValue}
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
      )
    // -------------------------------------------------------
    // DATE
    // -------------------------------------------------------
    case "date": {
      return (
        <BlockStack gap="300">
          {!hideLabel && fieldLabelWithIcon}

          {/* DATE + TIME */}
          {format === "date_time" && (
            <FlatpickrField
              key={`combined-date-time-${normalizedElement.otherLanguage ? normalizedElement.localization || "en" : "en"}`}
              value={dateValue || ""}
              options={dateTimePickerOptions}
              onChange={updateDateValue}
              placeholder={placeholder || "Select date and time"}
              className="date-time-flatpickr-input"
            />
          )}

          {/* DATE ONLY */}
          {format === "date" && (
            <FlatpickrField
              key={`date-picker-${normalizedElement.otherLanguage ? normalizedElement.localization || "en" : "en"}-${onlyShowMonth ? "month" : "day"}`}
              value={dateOnlyValue}
              options={datePickerOptions}
              onChange={updateDateValue}
              placeholder={
                onlyShowMonth
                  ? placeholder || "Select month"
                  : placeholder || "Select date"
              }
              className="date-time-flatpickr-input"
            />
          )}

          {/* TIME PICKER */}
          {format === "time" && timeType === "picker" && (
            <FlatpickrField
              key={`time-picker-${normalizedElement.otherLanguage ? normalizedElement.localization || "en" : "en"}`}
              value={timeOnlyValue}
              options={timePickerOptions}
              onChange={updateDateValue}
              placeholder="Select time"
              className="date-time-flatpickr-input"
            />
          )}

          {/* TIME DROPDOWN */}
          {format === "time" && timeType === "dropdown" && (
            <Select
              label="Select time"
              labelHidden
              placeholder="Select time"
              options={timeOptions}
              value={dateValue || ""}
              onChange={updateDateValue}
            />
          )}

          {descriptionText}
        </BlockStack>
      );
    }
    // -------------------------------------------------------
    // NUMBER
    // -------------------------------------------------------
    case "number": {
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
      const buttonStyle = {
        all: "unset",
        width: "36px",
        height: "36px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        fontWeight: 400,
        color: "#303030",
        cursor: "pointer",
        textAlign: "center",
        boxSizing: "border-box",
      };

      return (
        <div style={{ width: "100%", minWidth: 0 }}>
          {!hideLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#303030",
              }}
            >
              {label}
              {required && (
                <span style={{ color: "#D72C0D" }}>*</span>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              minHeight: "48px",
              padding: "0 8px",
              background: "#F6F6F7",
              border: "1px solid #D8DADD",
              borderRadius: "8px",
              boxSizing: "border-box",
              gap: "8px",
            }}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={isReadOnly || safeValue <= quantityMin}
              onClick={decreaseValue}
              style={{
                ...buttonStyle,
                color: safeValue <= quantityMin ? "#C9CCCF" : "#303030",
                cursor:
                  isReadOnly || safeValue <= quantityMin
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              −
            </button>

            <span
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 500,
                color: "#303030",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {safeValue}
            </span>

            <button
              type="button"
              aria-label="Increase quantity"
              disabled={isReadOnly || safeValue >= quantityMax}
              onClick={increaseValue}
              style={{
                ...buttonStyle,
                color: safeValue >= quantityMax ? "#C9CCCF" : "#303030",
                cursor:
                  isReadOnly || safeValue >= quantityMax
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              +
            </button>
          </div>

          {descriptionText}
        </div>
      );
    }
    // -------------------------------------------------------
    // REPEATER
    // -------------------------------------------------------
    case "repeater": {
      const addButtonText =
        normalizedElement.addButtonText || "Add more";

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          {/* Repeater input rows */}
          {repeaterItems.map((item, index) => (
            <InlineStack
              key={`${normalizedElement.id}-${index}`}
              gap="200"
              blockAlign="center"
              wrap={false}
            >
              {/* Editable input */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextField
                  label=""
                  labelHidden
                  type="text"
                  placeholder={`${placeholder || "Enter value"} ${index + 1}`}
                  value={String(item ?? "")}
                  onChange={(newValue) =>
                    handleItemChange(index, newValue)
                  }
                  autoComplete="off"
                  disabled={isReadOnly}
                />
              </div>

              {/* Remove button */}
              {repeaterItems.length > minItems && (
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

          {/* Add button */}
          {repeaterItems.length < maxItems && (
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

          {/* Item count */}
          <Text as="p" variant="bodySm" tone="subdued">
            {repeaterItems.length} / {maxItems} items
          </Text>

          {/* Description */}
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
    case "rating_level": {
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {ratingLevels.map((n) => (
              <button
                key={n}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleRatingChange(n)}
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
              {lowLabel}
            </Text>

            <Text as="span" variant="bodySm" tone="subdued">
              {highLabel}
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
              {ratingStars.map((star) => (
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
                    onClick={() => handleRatingChange(star)}
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
                      color: star <= rating ? ratingColor : "#C9CCCF",
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
                        {PolarisIcons[customRatingIcon] ? (
                          <Icon source={PolarisIcons[customRatingIcon]} />
                        ) : (
                          "★"
                        )}
                      </span>
                    ) : (
                      "★"
                    )}
                  </button>

                  {showNumberUnderIcon && (
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
    // FEEDBACK
    // -------------------------------------------------------
    case "feedback": {
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          {normalizedElement.content && (
            <Text as="p" variant="bodyMd">
              {normalizedElement.content}
            </Text>
          )}

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
                gap: "clamp(4px, 2cqw, 9px)",
                alignItems: "center",
                justifyContent: "flex-start",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            >
              {feedbackEmojis.map((emoji, index) => {
                const isSelected = selectedValues.includes(emoji);

                return (
                  <div
                    key={`${emoji}-${index}`}
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
                      onClick={() => handleFeedbackSelection(emoji)}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        maxWidth: "90px",
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "clamp(25px, 12cqw, 54px)",
                        lineHeight: 1,
                        background: isSelected ? "#EAF1EF" : "transparent",
                        cursor: isReadOnly ? "default" : "pointer",
                        padding: "2px",
                        boxSizing: "border-box",
                        overflow: "hidden",
                        borderRadius: "8px",
                        border: isSelected
                          ? "2px solid #2E4E49"
                          : "1px solid transparent",
                        transition: "all 150ms ease",
                      }}
                    >
                      {emoji}
                    </button>
                  </div>
                );
              })}
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
          onChange={reportChange}
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
            disabled={isReadOnly}
            style={{ display: "none" }}
          />

          <div
            onClick={() => {
              if (!isReadOnly) {
                fileInputRef.current?.click();
              }
            }}
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
              cursor: isReadOnly ? "default" : "pointer",
              opacity: isReadOnly ? 0.7 : 1,
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
                opacity: isReadOnly ? 0.6 : 1,
              }}
            >
              {buttonText}
            </div>
          </div>

          {!isReadOnly && fileError && (
            <Text as="p" variant="bodySm" tone="critical">
              {fileError}
            </Text>
          )}

          {selectedFiles.length > 0 && (
            <BlockStack gap="100">
              {selectedFiles.map((file, index) => (
                <InlineStack
                  key={`${file.name}-${index}`}
                  align="space-between"
                >
                  <Text as="span" variant="bodySm">
                    {file.name}
                  </Text>

                  {!isReadOnly && (
                    <Button
                      variant="plain"
                      tone="critical"
                      onClick={() => handleFileRemove(index)}
                    >
                      Remove
                    </Button>
                  )}
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

      // Use existing field value as the single source of truth.
      const selectedImages = Array.isArray(value)
        ? value
        : value
          ? [value]
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

                          updateValue(updatedImages);
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

                    updateValue(updatedImages);

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
                onClick={() => handleColorChange(color)}
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
              onChange={handleColorChange}
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
      console.log("footer nav", {
        isReadOnly,
        isModelPreview,
        customerPageCount,
        isFirstCustomerPage,
        isLastCustomerPage,
        hasOnNext: typeof onNext,
      });
      // Shared styling for Previous, Next, Reset and Submit.
      const footerButtonStyle = {
        width: normalizedElement.fullWidthButton ? "100%" : "auto",

        backgroundColor:
          normalizedElement.buttonBackgroundColor || "#2E4E49",

        color:
          normalizedElement.buttonTextColor || "#ffffff",

        border: "none",
        borderRadius: "6px",
        padding: "12px 20px",
        fontSize: "14px",
        fontWeight: 600,
      };
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
            {/* =========================================
            EDITOR MODE
            Keep the configured footer buttons.
            They are disabled because isReadOnly is true.
        ========================================= */}

            {!isModelPreview && (
              <>
                {/* //previous  */}
                {normalizedElement.showPreviousButton && (
                  <button
                    type="button"
                    // disabled={isReadOnly}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      ...footerButtonStyle,
                      cursor: "pointer",
                    }}
                  >
                    {normalizedElement.previousText || "Previous"}
                  </button>
                )}
                {/* //next */}
                {normalizedElement.showNextButton && (
                  <button
                    type="button"

                    onClick={(event) => event.stopPropagation()}
                    style={{
                      ...footerButtonStyle,
                      cursor: "pointer",
                    }}
                  >
                    {normalizedElement.nextText || "Next"}
                  </button>
                )}
                {/* //reset */}
                {normalizedElement.showResetButton && (
                  <button
                    type="button"

                    onClick={(event) => event.stopPropagation()}
                    style={{
                      ...footerButtonStyle,
                      cursor: "pointer",
                    }}
                  >
                    {normalizedElement.resetButtonText || "Reset"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    ...footerButtonStyle,
                    cursor: "pointer",
                  }}
                >
                  {normalizedElement.submitText || "Submit"}
                </button>
              </>
            )}

            {/* =========================================
            CUSTOMER PREVIEW MODE
            Navigation is automatically generated
            from the actual number of visible pages.
        ========================================= */}

            {isModelPreview && (
              <>
                {/* Previous: show on page 2 onwards. */}
                {hasMultiplePages && !isFirstCustomerPage && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPrevious?.();
                    }}
                    style={footerButtonStyle}
                  >
                    {normalizedElement.previousText || "Previous"}
                  </button>
                )}

                {/* Next: show on every page except the last. */}
                {hasMultiplePages && !isLastCustomerPage && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onNext?.();
                    }}
                    style={footerButtonStyle}
                  >
                    {normalizedElement.nextText || "Next"}
                  </button>
                )}

                {/* Submit: show on a single page or the last page. */}
                {(!hasMultiplePages || isLastCustomerPage) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSubmit?.();
                    }}
                    style={footerButtonStyle}
                  >
                    {normalizedElement.submitText || "Send message"}
                  </button>
                )}

                {/* Preserve the optional reset button. */}
                {normalizedElement.showResetButton && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onReset?.();
                    }}
                    style={footerButtonStyle}
                  >
                    {normalizedElement.resetButtonText || "Reset"}
                  </button>
                )}
              </>
            )}
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
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Text
            as="span"
            variant="bodySm"
            tone="subdued"
            alignment="center"
          >
            {value || "Hidden field"}
          </Text>

          <Text
            as="p"
            variant="bodySm"
            tone="subdued"
            alignment="center"
          >
            This field will not be visible to customers on the published form.
          </Text>
        </div>
      );
    // -------------------------------------------------------
    // RANGE SLIDER
    // -------------------------------------------------------
    case "range_slider": {
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}
          <input
            type="range"
            min={rangeMin}
            max={rangeMax}
            step={rangeStep}
            value={rangeValue}
            disabled={isReadOnly}
            onChange={(event) =>
              handleRangeChange(event.target.value)
            }
            style={{ width: "100%" }}
          />

          {showRangeValue && (
            <Text as="p" variant="bodySm">
              {rangeValue}
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
                        questionIndex % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
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
                      const checked = isAnswerSelected(question, answer);

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
                            type={matrixAllowMultiple ? "checkbox" : "radio"}
                            name={`matrix-${normalizedElement.id || "field"}-${questionIndex}`}
                            value={answer.value}
                            checked={checked}
                            disabled={isReadOnly}
                            required={
                              !matrixAllowMultiple &&
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
                              cursor: isReadOnly ? "default" : "pointer",
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
              onClick={handleSwitchChange}
              className={`preview-switch ${switchValue ? "is-on" : "is-off"}`}
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
    // IMAGE DROPDOWN
    // -------------------------------------------------------
    case "image_dropdown": {
      const showOptionLabel =
        normalizedElement.showOptionLabel !== false;

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
                      onClick={() =>
                        handleImageDropdownSelect(option)
                      }
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
                        alt={option.label || "Option"}
                        onError={(event) => {
                          console.log("IMAGE FAILED:", {
                            label: option.label,
                            image: option.image,
                            option,
                          });

                          event.currentTarget.style.display = "none";
                        }}
                        onLoad={() => {
                          console.log("IMAGE LOADED:", option.image);
                        }}
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

          {descriptionText}
        </BlockStack>
      );
    }
    // -------------------------------------------------------
    // PRODUCT
    // -------------------------------------------------------
    case "product": {
      const isList = normalizedElement.productLayout === "list";

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
                          handleProductSelect(product);
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
                            <Text
                              as="p"
                              variant="bodySm"
                              tone="subdued"
                            >
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
    //text
    case "text": {
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <TextField
            value={value || ""}
            placeholder={placeholder || ""}
            disabled={isReadOnly}
            autoComplete="off"
            maxLength={
              textFieldHasCharacterLimit && textFieldMaxLength > 0
                ? textFieldMaxLength
                : undefined
            }
            onChange={handleTextChange}
          />

          {descriptionText}
        </BlockStack>
      );
    }
    case "textarea": {
      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <TextField
            value={value || ""}
            placeholder={placeholder || ""}
            multiline={4}
            disabled={isReadOnly}
            autoComplete="off"
            maxLength={
              textFieldHasCharacterLimit && textFieldMaxLength > 0
                ? textFieldMaxLength
                : undefined
            }
            onChange={handleTextChange}
          />

          {textFieldHasCharacterLimit && (
            <Text as="p" variant="bodySm" tone="subdued">
              {characterCount}
              {textFieldMaxLength > 0
                ? ` / ${textFieldMaxLength}`
                : " characters"}
            </Text>
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
          onChange={updateValue}
          readOnly={isReadOnly}
        />
      );
  }
}