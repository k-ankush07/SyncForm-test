import React, { useEffect, useState, useRef } from "react";
import flatpickr from "flatpickr";
import flatpickrLocales from "flatpickr/dist/l10n/index.js";
import "flatpickr/dist/flatpickr.min.css";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";
import "flatpickr/dist/plugins/monthSelect/style.css";
import SignaturePad from "signature_pad";
import "flag-icons/css/flag-icons.min.css";
import * as PolarisIcons from "@shopify/polaris-icons";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import { French } from "flatpickr/dist/l10n/fr.js";
import { German } from "flatpickr/dist/l10n/de.js";
import { Italian } from "flatpickr/dist/l10n/it.js";
import { Portuguese } from "flatpickr/dist/l10n/pt.js";
import { Dutch } from "flatpickr/dist/l10n/nl.js";
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



// =============================================================
// SIGNATURE PREVIEW COMPONENT
// Hooks must live inside a component, not inside a switch case.
// =============================================================


// =============================================================
// 1. SIGNATURE PREVIEW
// =============================================================

function SignaturePreview({
  element,
  label,
  hideLabel,
  required,
  descriptionText,
  isReadOnly,
  onChange,
}) {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const uploadedPreviewUrlRef = useRef(null);

  const [uploadedSignature, setUploadedSignature] = useState(null);

  // Always use the latest callback without recreating SignaturePad.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const showCanvas = element.showCanvas !== false;
  const allowFileUpload = element.allowFileUpload === true;

  const canvasHeight = Number(element.canvasHeight) || 150;
  const penColor = element.penColor || "#000000";
  const penWidth = Number(element.penWidth) || 2;
  const canvasBackground = element.canvasBackground || "#ffffff";

  // Create and configure SignaturePad.
  useEffect(() => {
    if (!showCanvas || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const signaturePad = new SignaturePad(canvas, {
      penColor,
      minWidth: penWidth,
      maxWidth: penWidth,
      backgroundColor: canvasBackground,
    });

    signaturePadRef.current = signaturePad;

    // Send the completed drawing to the parent.
    const handleEndStroke = () => {
      if (signaturePad.isEmpty()) {
        onChangeRef.current?.(null);
        return;
      }

      onChangeRef.current?.({
        type: "drawn",
        dataUrl: signaturePad.toDataURL("image/png"),
      });
    };

    signaturePad.addEventListener("endStroke", handleEndStroke);

    // Resize the canvas without losing an existing drawing.
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      const drawingData = signaturePad.isEmpty()
        ? null
        : signaturePad.toData();

      canvas.width = Math.max(1, canvas.offsetWidth * ratio);
      canvas.height = Math.max(1, canvasHeight * ratio);

      const context = canvas.getContext("2d");

      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      signaturePad.clear();

      if (drawingData) {
        signaturePad.fromData(drawingData);
      }
    };

    resizeCanvas();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resizeCanvas)
        : null;

    resizeObserver?.observe(canvas);

    return () => {
      resizeObserver?.disconnect();
      signaturePad.removeEventListener("endStroke", handleEndStroke);
      signaturePad.off();

      if (signaturePadRef.current === signaturePad) {
        signaturePadRef.current = null;
      }
    };
  }, [
    element.id,
    showCanvas,
    canvasHeight,
    penColor,
    penWidth,
    canvasBackground,
  ]);

  // Release the previous upload preview URL when replaced.
  const handleSignatureUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (uploadedPreviewUrlRef.current) {
      URL.revokeObjectURL(uploadedPreviewUrlRef.current);
    }

    uploadedPreviewUrlRef.current = previewUrl;

    setUploadedSignature({
      file,
      previewUrl,
    });

    // Send the actual File object to the parent.
    onChangeRef.current?.({
      type: "uploaded",
      file,
    });

    // Allow selecting the same file again.
    event.target.value = "";
  };

  // Revoke the final preview URL when this component unmounts.
  useEffect(() => {
    return () => {
      if (uploadedPreviewUrlRef.current) {
        URL.revokeObjectURL(uploadedPreviewUrlRef.current);
        uploadedPreviewUrlRef.current = null;
      }
    };
  }, []);

  // Clear the drawing and notify the parent.
  const clearSignature = () => {
    signaturePadRef.current?.clear();
    onChangeRef.current?.(null);
  };

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
              background: canvasBackground,
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
                src={uploadedSignature.previewUrl}
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
// 2. REUSABLE FLATPICKR FIELD
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
  icon,
  description,
  children,
}) {
  return (
    <BlockStack gap="200">
      {/* FIELD LABEL */}
      {label && (
        <Text as="label" variant="bodyMd">
          {label}
          {required && (
            <span style={{ color: "var(--p-color-text-critical)" }}>
              {" "}*
            </span>
          )}
        </Text>
      )}

      {/* INPUT WITH LEFT ICON */}
      <div
        style={{
          display: "flex",
          width: "100%",
          minWidth: 0,
          alignItems: "stretch",
          background: "#F6F6F7",
          borderRadius: "8px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* LEFT ICON AREA */}
        {icon && (
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
            <Icon source={icon} />
          </div>
        )}

        {/* INPUT AREA */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {children}
        </div>
      </div>

      {/* DESCRIPTION */}
      {description}
    </BlockStack>
  );
}


// =============================================================
// 3. MAIN PREVIEW FIELD COMPONENT
// =============================================================

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
  error,
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
  const placeholder = normalizedElement.placeholder || label;
  const defaultValue = normalizedElement.defaultValue ?? "";
  const required = Boolean(normalizedElement.required);

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

  // Send a value to LivePreview using this element's ID.
  const reportChange = (nextValue) => {
    if (currentElement?.id == null) return;

    onChange?.(currentElement.id, nextValue);
  };

  // Update local state immediately and save the same value in parent.
  const updateValue = (nextValue) => {
    setValue(nextValue);
    reportChange(nextValue);
  };

  // ===========================================================
  // 3.3 RESTORE SAVED TEXT VALUES
  // ===========================================================

  // Convert the parent's saved value into the text displayed by inputs.
  // Some field types save objects rather than plain strings.
  const getSavedTextValue = () => {
    if (savedValue === undefined || savedValue === null) {
      return String(defaultValue ?? "");
    }

    if (typeof savedValue === "object" && !Array.isArray(savedValue)) {
      if ("email" in savedValue) {
        return String(savedValue.email ?? "");
      }

      if ("password" in savedValue) {
        return String(savedValue.password ?? "");
      }

      if ("number" in savedValue) {
        return String(savedValue.number ?? "");
      }

      return String(defaultValue ?? "");
    }

    if (Array.isArray(savedValue)) {
      return "";
    }

    return String(savedValue);
  };

  // Local text value used by TextField and other input controls.
  const [value, setValue] = useState(getSavedTextValue);

  const [nameError, setNameError] = useState("");
  const [numberError, setNumberError] = useState("");

  // ===========================================================
  // 3.4 CHOICE FIELD STATE
  // ===========================================================

  const getSavedSelection = () => {
    if (savedValue !== undefined && savedValue !== null) {
      if (Array.isArray(savedValue)) {
        return savedValue;
      }

      if (typeof savedValue === "string") {
        return savedValue ? [savedValue] : [];
      }

      if (
        typeof savedValue === "object" &&
        savedValue.value !== undefined
      ) {
        if (Array.isArray(savedValue.value)) {
          return savedValue.value;
        }

        return savedValue.value ? [savedValue.value] : [];
      }
    }

    return normalizedElement.defaultValue
      ? [normalizedElement.defaultValue]
      : [];
  };

  const getSavedOtherValue = () => {
    if (
      savedValue &&
      typeof savedValue === "object" &&
      !Array.isArray(savedValue)
    ) {
      return savedValue.otherValue || "";
    }

    return normalizedElement.otherValue || "";
  };

  const [selected, setSelected] = useState(getSavedSelection);
  const [otherValue, setOtherValue] = useState(getSavedOtherValue);

  // Restore choice values when the field changes or a saved answer arrives.
  // Compare first so typing/selecting is not needlessly reset.
  useEffect(() => {
    const nextSelection = getSavedSelection();
    const nextOtherValue = getSavedOtherValue();

    setSelected((previous) =>
      JSON.stringify(previous) === JSON.stringify(nextSelection)
        ? previous
        : nextSelection
    );

    setOtherValue((previous) =>
      previous === nextOtherValue ? previous : nextOtherValue
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // ===========================================================
  // 3.5 CHECKBOX AND CONSENT STATE
  // ===========================================================

  const getSavedCheckedValue = () => {
    if (typeof savedValue === "boolean") {
      return savedValue;
    }

    return type === "consent"
      ? normalizedElement.checkedByDefault ?? true
      : Boolean(normalizedElement.defaultValue);
  };

  const [checked, setChecked] = useState(getSavedCheckedValue);

  useEffect(() => {
    const nextChecked = getSavedCheckedValue();

    setChecked((previous) =>
      previous === nextChecked ? previous : nextChecked
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    normalizedElement.checkedByDefault,
    savedValue,
    type,
  ]);

  // ===========================================================
  // 3.6 PASSWORD AND EMAIL CONFIRMATION STATE
  // ===========================================================

  const [confirmPasswordValue, setConfirmPasswordValue] = useState(
    () =>
      savedValue && typeof savedValue === "object"
        ? savedValue.confirmPassword ?? ""
        : ""
  );

  const [confirmEmailValue, setConfirmEmailValue] = useState(
    () =>
      savedValue && typeof savedValue === "object"
        ? savedValue.confirmEmail ?? ""
        : ""
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordValidationTriggered, setPasswordValidationTriggered] =
    useState(false);

  // ===========================================================
  // 3.7 PHONE STATE
  // ===========================================================

  const configuredPhoneCountry =
    normalizedElement.defaultCountryCode &&
      normalizedElement.defaultCountryCode !== "auto"
      ? normalizedElement.defaultCountryCode.toLowerCase()
      : "in";

  const getSavedPhoneCountry = () => {
    if (
      savedValue &&
      typeof savedValue === "object" &&
      savedValue.country
    ) {
      return String(savedValue.country).toLowerCase();
    }

    return configuredPhoneCountry;
  };

  const [phoneCountry, setPhoneCountry] = useState(
    getSavedPhoneCountry
  );

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // ===========================================================
  // 3.8 COUNTRY AND DROPDOWN STATE
  // ===========================================================

  const [countrySearch, setCountrySearch] = useState("");

  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (typeof savedValue === "string") {
      return savedValue;
    }

    return typeof normalizedElement.defaultValue === "string"
      ? normalizedElement.defaultValue
      : "";
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  useEffect(() => {
    setDropdownOpen(false);
    setDropdownSearch("");
  }, [normalizedElement.id]);

  // ===========================================================
  // 3.9 DATE AND TIME STATE
  // ===========================================================

  const getSavedDateValue = () => {
    if (savedValue !== undefined && savedValue !== null) {
      return String(savedValue);
    }

    return String(
      normalizedElement.defaultDate ??
      normalizedElement.defaultValue ??
      ""
    );
  };

  const [dateValue, setDateValue] = useState(getSavedDateValue);

  // ===========================================================
  // 3.10 FILE AND IMAGE STATE
  // ===========================================================

  const [imagePreview, setImagePreview] = useState([]);

  const fileInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState(() =>
    Array.isArray(savedValue) ? savedValue : []
  );

  const [fileError, setFileError] = useState("");

  // ===========================================================
  // 3.11 RATING AND RANGE STATE
  // ===========================================================

  const [rating, setRating] = useState(() =>
    Number(savedValue ?? normalizedElement.defaultRating ?? 0)
  );

  const getDefaultRangeValue = () => {
    const min = Number(normalizedElement.min ?? 0);
    const max = Number(normalizedElement.max ?? 100);

    const initialValue =
      savedValue !== undefined && savedValue !== null
        ? Number(savedValue)
        : Number(normalizedElement.defaultValue);

    return Number.isFinite(initialValue)
      ? Math.min(max, Math.max(min, initialValue))
      : min;
  };

  const [rangeValue, setRangeValue] = useState(getDefaultRangeValue);

  useEffect(() => {
    const nextValue = getDefaultRangeValue();

    setRangeValue((previous) =>
      previous === nextValue ? previous : nextValue
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    normalizedElement.min,
    normalizedElement.max,
    savedValue,
  ]);

  // ===========================================================
  // 3.12 SWITCH STATE
  // ===========================================================

  const getSavedSwitchValue = () => {
    if (typeof savedValue === "boolean") {
      return savedValue;
    }

    return Boolean(normalizedElement.defaultChecked);
  };

  const [switchValue, setSwitchValue] = useState(getSavedSwitchValue);

  useEffect(() => {
    const nextValue = getSavedSwitchValue();

    setSwitchValue((previous) =>
      previous === nextValue ? previous : nextValue
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultChecked,
    savedValue,
  ]);

  // ===========================================================
  // 3.13 COLOR STATE
  // ===========================================================

  const [colorValue, setColorValue] = useState(
    normalizedElement.defaultColor || "#563D7C"
  );

  useEffect(() => {
    setColorValue(
      normalizedElement.defaultColor || "#563D7C"
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultColor,
  ]);

  // ===========================================================
  // 3.14 OTHER UI STATE
  // ===========================================================

  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);

  useEffect(() => {
    setImageDropdownOpen(false);
  }, [normalizedElement.id]);


  // ===========================================================
  // REPEATER STATE
  // ===========================================================

  // Repeater values must always be stored as an array.
  const getInitialRepeaterItems = () => {
    if (Array.isArray(savedValue)) {
      return savedValue;
    }

    if (
      savedValue !== undefined &&
      savedValue !== null &&
      savedValue !== ""
    ) {
      return [String(savedValue)];
    }

    return [""];
  };

  const [repeaterItems, setRepeaterItems] = useState(
    getInitialRepeaterItems
  );

  // Synchronize when the parent loads or changes saved data.
  // Do not reset local state if the parent sends back the same array.
  useEffect(() => {
    const nextItems = getInitialRepeaterItems();

    setRepeaterItems((previous) =>
      JSON.stringify(previous) === JSON.stringify(nextItems)
        ? previous
        : nextItems
    );
  }, [normalizedElement.id, savedValue]);

  // Update Repeater locally AND send the array to LivePreview.
  const updateRepeaterValue = (nextItems) => {
    setRepeaterItems(nextItems);
    reportChange(nextItems);
  };


  // ===========================================================
  // 4. SYNCHRONIZE SAVED TEXT VALUES
  // ===========================================================

  // IMPORTANT:
  // savedValue is a dependency because the parent may restore data
  // after loading. However, we only update local state when the
  // incoming value is actually different from the current value.
  //
  // During typing, the parent sends back the same value the user
  // just entered. The comparison prevents that update from resetting
  // the input or interrupting typing.

  useEffect(() => {
    const nextTextValue = getSavedTextValue();

    setValue((previous) =>
      previous === nextTextValue ? previous : nextTextValue
    );

    const nextConfirmPassword =
      savedValue && typeof savedValue === "object"
        ? savedValue.confirmPassword ?? ""
        : "";

    setConfirmPasswordValue((previous) =>
      previous === nextConfirmPassword
        ? previous
        : nextConfirmPassword
    );

    const nextConfirmEmail =
      savedValue && typeof savedValue === "object"
        ? savedValue.confirmEmail ?? ""
        : "";

    setConfirmEmailValue((previous) =>
      previous === nextConfirmEmail
        ? previous
        : nextConfirmEmail
    );

    setPasswordValidationTriggered(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNameError("");
    setNumberError("");
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // ===========================================================
  // 5. SYNCHRONIZE PHONE VALUE
  // ===========================================================

  // Only phone fields may use this effect.
  // This prevents phone defaults from overwriting name/email/text fields.

  useEffect(() => {
    if (type !== "phone") return;

    const nextPhoneNumber =
      savedValue &&
        typeof savedValue === "object" &&
        !Array.isArray(savedValue)
        ? savedValue.number ?? ""
        : savedValue ?? normalizedElement.defaultValue ?? "";

    const nextCountry = getSavedPhoneCountry();

    setValue((previous) => {
      const next = String(nextPhoneNumber);

      return previous === next ? previous : next;
    });

    setPhoneCountry((previous) =>
      previous === nextCountry ? previous : nextCountry
    );

    setCountryDropdownOpen(false);
  }, [
    type,
    normalizedElement.id,
    normalizedElement.defaultCountryCode,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // ===========================================================
  // 6. SYNCHRONIZE DATE VALUE
  // ===========================================================

  useEffect(() => {
    const nextDateValue = getSavedDateValue();

    setDateValue((previous) =>
      previous === nextDateValue ? previous : nextDateValue
    );
  }, [
    normalizedElement.id,
    normalizedElement.defaultDate,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // ===========================================================
  // 7. RESTORE COUNTRY SELECTION
  // ===========================================================

  useEffect(() => {
    const nextCountry =
      typeof savedValue === "string"
        ? savedValue
        : typeof normalizedElement.defaultValue === "string"
          ? normalizedElement.defaultValue
          : "";

    setSelectedCountry((previous) =>
      previous === nextCountry ? previous : nextCountry
    );

    setCountrySearch("");
    setCountryDropdownOpen(false);
  }, [
    normalizedElement.id,
    normalizedElement.defaultValue,
    savedValue,
  ]);

  // ===========================================================
  // 8. FIELD CHANGE HANDLERS
  // ===========================================================

  // Name validation and optional numbers-only setting.
  const handleNameChange = (newValue) => {
    const input = String(newValue ?? "");

    if (normalizedElement.numbersOnly) {
      updateValue(input.replace(/[^0-9]/g, ""));
      setNameError("");
      return;
    }

    updateValue(input);

    if (normalizedElement.nameValidation !== false && input) {
      const validName = /^[\p{L}\p{M}\s'.-]+$/u.test(input);

      setNameError(
        validName ? "" : "Please enter a valid name."
      );

      return;
    }

    setNameError("");
  };

  // Number input: accept digits only and show an error otherwise.
  const handleNumberChange = (newValue) => {
    const input = String(newValue ?? "");

    if (input !== "" && !/^\d+$/.test(input)) {
      updateValue(input);
      setNumberError("Please enter numbers only.");
      return;
    }

    updateValue(input);
    setNumberError("");
  };

  // ===========================================================
  // 9. CHOICE AND PHONE HELPERS
  // ===========================================================

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

  // Phone country data.
  const phoneCountryList = countries;

  const currentPhoneCountry =
    phoneCountryList.find(
      (country) => country.value.toLowerCase() === phoneCountry
    ) ||
    phoneCountryList.find(
      (country) => country.value.toLowerCase() === "in"
    );

  const showPhoneCountry =
    normalizedElement.phoneValidation !== false ||
    normalizedElement.showCountryCode !== false;

  // Send the phone number together with its country information.
  const reportPhoneValue = (
    nextNumber,
    countryCode = phoneCountry
  ) => {
    const selectedPhoneCountry = phoneCountryList.find(
      (country) =>
        country.value.toLowerCase() ===
        String(countryCode).toLowerCase()
    );

    reportChange({
      country:
        selectedPhoneCountry?.value?.toLowerCase() ||
        countryCode,
      dialCode: selectedPhoneCountry?.dialCode || "",
      number: nextNumber,
    });
  };

  // Change selected phone country.
  const handlePhoneCountryChange = (countryCode) => {
    const nextCountry = countryCode.toLowerCase();

    setPhoneCountry(nextCountry);
    reportPhoneValue(value, nextCountry);
  };

  // Handle phone input and detect international calling codes.
  const handlePhoneChange = (newValue) => {
    const input = String(newValue ?? "");

    if (input.startsWith("+") || input.startsWith("00")) {
      const internationalInput = input.startsWith("00")
        ? `+${input.slice(2)}`
        : input;

      const digits = internationalInput
        .slice(1)
        .replace(/\D/g, "");

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
            (country) =>
              country.value.toLowerCase() === phoneCountry
          ) || sameCodeMatches[0];

        const dialDigits = matchedCountry.dialCode.replace(
          /\D/g,
          ""
        );

        const phoneNumber = digits.slice(dialDigits.length);

        setPhoneCountry(matchedCountry.value.toLowerCase());
        setValue(phoneNumber);

        reportPhoneValue(phoneNumber, matchedCountry.value);
        return;
      }

      // Preserve an incomplete international number while typing.
      setValue(internationalInput);
      reportPhoneValue(internationalInput);
      return;
    }

    // National phone number: digits only.
    const phoneNumber = input.replace(/\D/g, "");

    setValue(phoneNumber);
    reportPhoneValue(phoneNumber);
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

  const commonSelectProps = {
    label,
    labelHidden: hideLabel,
    helpText: description || undefined,
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

  // ===========================================================
  // 12. PASSWORD VALIDATION
  // ===========================================================

  const getPasswordError = () => {
    const password = String(value || "");

    if (required && !password.trim()) {
      return `${label} is required.`;
    }

    if (normalizedElement.limitCharacters) {
      const min =
        normalizedElement.minCharacters !== ""
          ? Number(normalizedElement.minCharacters)
          : null;

      const max =
        normalizedElement.maxCharacters !== ""
          ? Number(normalizedElement.maxCharacters)
          : null;

      if (min !== null && password.length < min) {
        return `Password must contain at least ${min} characters.`;
      }

      if (max !== null && password.length > max) {
        return `Password cannot exceed ${max} characters.`;
      }
    }

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

    if (
      normalizedElement.confirmPassword &&
      password !== confirmPasswordValue
    ) {
      return "Passwords do not match.";
    }

    return "";
  };

  // ===========================================================
  // 13. FILE VALIDATION
  // ===========================================================

  const acceptedFileTypes = Array.isArray(
    normalizedElement.acceptedFileTypes
  )
    ? normalizedElement.acceptedFileTypes
    : [];

  const acceptAttribute = acceptedFileTypes
    .map((extension) => `.${extension}`)
    .join(",");

  const fileSizeLimit =
    Number(normalizedElement.fileSizeLimit) || 0;

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
      const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

      if (
        acceptedFileTypes.length > 0 &&
        !acceptedFileTypes.includes(extension)
      ) {
        setFileError(`.${extension} files are not allowed.`);
        continue;
      }

      if (maxFileSize > 0 && file.size > maxFileSize) {
        setFileError(
          `${file.name} exceeds the ${fileSizeLimit} MB size limit.`
        );
        continue;
      }

      validFiles.push(file);
    }

    const combinedFiles = normalizedElement.allowMultiple
      ? [...selectedFiles, ...validFiles]
      : validFiles.slice(0, 1);

    let finalFiles;

    if (maxFiles > 0 && combinedFiles.length > maxFiles) {
      setFileError(
        `You can select a maximum of ${maxFiles} files.`
      );

      finalFiles = combinedFiles.slice(0, maxFiles);
    } else {
      finalFiles = combinedFiles;
    }

    setSelectedFiles(finalFiles);

    // Send the actual File objects to the parent.
    reportChange(finalFiles);

    // Allow selecting the same file again.
    event.target.value = "";
  };

  // ===========================================================
  // 14. DATE HELPERS
  // ===========================================================

  const getDateOnly = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const parseDateValue = (dateValueToParse) => {
    if (!dateValueToParse) return null;

    // Parse YYYY-MM-DD as a local date to avoid UTC date shifts.
    const match = String(dateValueToParse).match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      );
    }

    const parsed = new Date(dateValueToParse);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const addDays = (date, days) => {
    const result = new Date(date);

    result.setDate(result.getDate() + Number(days || 0));

    return result;
  };

  // ===========================================================
  // 15. TIME HELPERS
  // ===========================================================

  const getTimeMinutes = (timeValue) => {
    if (!timeValue) return null;

    const text = String(timeValue).trim();

    // 12-hour format, for example 01:30 PM.
    const twelveHour = text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (twelveHour) {
      let hours = Number(twelveHour[1]) % 12;

      if (twelveHour[3].toUpperCase() === "PM") {
        hours += 12;
      }

      return hours * 60 + Number(twelveHour[2]);
    }

    // 24-hour format, for example 13:30.
    const twentyFourHour = text.match(
      /^(\d{1,2}):(\d{2})$/
    );

    if (twentyFourHour) {
      return (
        Number(twentyFourHour[1]) * 60 +
        Number(twentyFourHour[2])
      );
    }

    return null;
  };

  const formatTimeOption = (totalMinutes, timeFormat) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (timeFormat === "12h") {
      const period = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;

      return `${String(displayHour).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")} ${period}`;
    }

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;
  };

  const getTimeOptions = (elementToUse) => {
    const step = Math.max(
      1,
      Math.min(60, Number(elementToUse.timeStep) || 15)
    );

    const timeFormat = elementToUse.timeFormat || "24h";

    const start =
      elementToUse.enableStartTime === true
        ? getTimeMinutes(elementToUse.startTime)
        : 0;

    const end =
      elementToUse.enableEndTime === true
        ? getTimeMinutes(elementToUse.endTime)
        : 23 * 60 + 59;

    if (start === null || end === null || start > end) {
      return [];
    }

    const timeOptions = [];

    for (
      let minutes = start;
      minutes <= end;
      minutes += step
    ) {
      const formattedTime = formatTimeOption(
        minutes,
        timeFormat
      );

      timeOptions.push({
        label: formattedTime,
        value: formattedTime,
      });
    }

    return timeOptions;
  };
  // =========================================================
  // 8. ELEMENT RENDERING
  // =========================================================
  // Completely hide the divider when Hide divider is enabled.
  if (type === "divider" && normalizedElement.hideDivider) {
    return null;
  }

// console.log("PREVIEW FIELD DEBUG:", {
//   originalType: element?.type,
//   finalType: type,
//   label,
//   value,
//   isModelPreview,
// });
  switch (type) {
    
    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    case "email": {
      const {
        label: _label,
        prefix: _prefix,
        helpText: _helpText,
        ...emailFieldProps
      } = commonTextFieldProps;

      return (
        <BlockStack gap="300">
          {/* MAIN EMAIL FIELD */}
          <PreviewInputShell
            label={label}
            required={required}
            icon={selectedIcon}
            description={descriptionText}
          >
            <TextField
              {...emailFieldProps}
              type="email"
              autoComplete="email"
              value={value}
              onChange={(nextValue) => {
                setValue(nextValue);

                reportChange({
                  email: nextValue,
                  confirmEmail: confirmEmailValue,
                });
              }}
              label=""
              labelHidden
              placeholder={placeholder}
              readOnly={isReadOnly}
              disabled={isReadOnly}
              requiredIndicator={false}
              borderless
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
              <TextField
                type="email"
                autoComplete="email"
                value={confirmEmailValue}
                onChange={(nextValue) => {
                  setConfirmEmailValue(nextValue);

                  reportChange({
                    email: value,
                    confirmEmail: nextValue,
                  });
                }}
                label=""
                labelHidden
                placeholder={
                  normalizedElement.confirmEmailPlaceholder ||
                  "Confirm your email"
                }
                readOnly={isReadOnly}
                disabled={isReadOnly}
                requiredIndicator={false}
                borderless
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
                updateValue(newValue);

                reportChange(
                  normalizedElement.confirmPassword
                    ? {
                      password: newValue,
                      confirmPassword: confirmPasswordValue,
                    }
                    : newValue
                );
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
                  normalizedElement.hideLabel
                    ? ""
                    : normalizedElement.confirmPasswordLabel ||
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
                onChange={(newValue) => {
                  setConfirmPasswordValue(newValue);

                  reportChange({
                    password: value,
                    confirmPassword: newValue,
                  });
                }}
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
        updateValue(country.value);
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
      // =====================================================
      // 1. PREPARE DROPDOWN OPTIONS
      // =====================================================

      const dropdownOptions = (normalizedElement.options || []).map(
        (option) => ({
          label:
            typeof option === "string"
              ? option
              : option.label || option.value,

          value:
            typeof option === "string"
              ? option
              : option.value || option.label,
        })
      );

      // =====================================================
      // 2. FIND CURRENTLY SELECTED OPTION
      // =====================================================

      const selectedOption = dropdownOptions.find(
        (option) => option.value === value
      );

      // =====================================================
      // 3. GET SELECTED ICON
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
      // 4. FILTER OPTIONS FOR SEARCH
      // =====================================================

      const filteredOptions = dropdownOptions.filter((option) =>
        String(option.label || "")
          .toLowerCase()
          .includes(dropdownSearch.toLowerCase())
      );

      // =====================================================
      // 5. HANDLE OPTION SELECTION
      // =====================================================

      const handleDropdownSelect = (option) => {
        updateValue(option.value);
        setDropdownOpen(false);
        setDropdownSearch("");
      };

      // =====================================================
      // 6. FIELD LABEL WITH PROPER ICON ALIGNMENT
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
          {/* ICON - FIXED WIDTH AND PERFECT CENTER ALIGNMENT */}

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

          {/* LABEL TEXT */}

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
      // 7. RENDER DROPDOWN
      // =====================================================

      return (
        <BlockStack gap="200">

          {/* FIELD LABEL */}

          {dropdownLabelWithIcon}

          <div
            style={{
              position: "relative",
              width: "100%",
            }}
          >

            {/* =========================================
            DROPDOWN BUTTON
        ========================================= */}

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

            {/* =========================================
            DROPDOWN PANEL
        ========================================= */}

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

                {/* =====================================
                SEARCH BAR
            ===================================== */}

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

                {/* =====================================
                OPTIONS LIST
            ===================================== */}

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

                          {/* OPTION LABEL */}

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

                          {/* SELECTED CHECKMARK */}

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
      // =====================================================
      // 1. CHECK OTHER OPTION
      // =====================================================

      const otherChecked = selected.includes("__other__");

      // =====================================================
      // 2. GET MINIMUM AND MAXIMUM SELECTION LIMITS
      // =====================================================

      const minSelections = Math.max(
        0,
        Number(normalizedElement.minSelections) || 0
      );

      const maxSelections = Math.max(
        0,
        Number(normalizedElement.maxSelections) || 0
      );

      // 0 means unlimited
      const isMaxReached =
        maxSelections > 0 && selected.length >= maxSelections;

      // =====================================================
      // 3. CHECK COLUMN WIDTH AND SET OPTIONS PER LINE
      // =====================================================

      const columnWidth = String(normalizedElement.columnWidth);

      let checkboxColumns = null;

      if (columnWidth === "33") {
        // 33% width = 2 options per line
        checkboxColumns = 2;
      } else if (columnWidth === "50") {
        // 50% width = 3 options per line
        checkboxColumns = 3;
      }

      // =====================================================
      // 4. FINAL CHECKBOX GRID STYLE
      // Preserve existing styles for other column widths
      // =====================================================

      const checkboxGridStyle =
        checkboxColumns !== null
          ? {
            ...choiceGridStyle,
            display: "grid",
            gridTemplateColumns: `repeat(${checkboxColumns}, minmax(0, 1fr))`,
          }
          : choiceGridStyle;

      // =====================================================
      // 5. RENDER CHECKBOX GROUP
      // =====================================================

      return (
        <BlockStack gap="200">

          {/* FIELD LABEL */}

          {fieldLabelWithIcon}

          {/* CHECKBOX OPTIONS GRID */}

          <div style={checkboxGridStyle}>
            {options.map((option, index) => {
              const isChecked = selected.includes(option.value);

              return (
                <Checkbox
                  key={`${option.value}-${index}`}
                  label={option.label}
                  checked={isChecked}
                  disabled={
                    isReadOnly || (!isChecked && isMaxReached)
                  }
                  onChange={(checked) => {
                    let updated = [...selected];

                    if (checked) {
                      // Prevent selecting more than maximum
                      if (
                        maxSelections > 0 &&
                        updated.length >= maxSelections
                      ) {
                        return;
                      }

                      updated.push(option.value);
                    } else {
                      updated = updated.filter(
                        (value) => value !== option.value
                      );
                    }

                    setSelected(updated);
                    reportChange(updated);
                  }}
                />
              );
            })}

            {/* OTHER CHECKBOX */}

            {normalizedElement.otherOption && (
              <Checkbox
                label={normalizedElement.otherLabel || "Other"}
                checked={otherChecked}
                disabled={
                  isReadOnly || (!otherChecked && isMaxReached)
                }
                onChange={(isChecked) => {
                  let updated = [...selected];

                  if (isChecked) {
                    if (
                      maxSelections > 0 &&
                      updated.length >= maxSelections
                    ) {
                      return;
                    }

                    updated.push("__other__");
                  } else {
                    updated = updated.filter(
                      (value) => value !== "__other__"
                    );
                  }

                  setSelected(updated);

                  const nextOtherValue = isChecked ? otherValue : "";

                  if (!isChecked) {
                    setOtherValue("");
                  }

                  reportChange({
                    value: updated,
                    otherValue: nextOtherValue,
                  });
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

                reportChange({
                  value: selected,
                  otherValue: newValue,
                });
              }}
              autoComplete="off"
            />
          )}

          {/* DESCRIPTION */}

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

                    reportChange(option.value);
                  }}
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
                  onChange={() => {
                    setSelected(["__other__"]);

                    reportChange({
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

                reportChange({
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
            onChange={(isChecked) => {
              setChecked(isChecked);//send data to liv e preview
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
      const format = normalizedElement.format || "date_time";

      const dateFormat = normalizedElement.dateFormat || "Y-m-d";
      const timeFormat = normalizedElement.timeFormat || "24h";
      const timeType = normalizedElement.timeType || "picker";

      const timeStep = Math.max(
        1,
        Math.min(60, Number(normalizedElement.timeStep) || 15)
      );

      // ===========================================================
      // LANGUAGE / LOCALE
      // ===========================================================

      const localeMap = {
        es: Spanish,
        spanish: Spanish,

        fr: French,
        french: French,

        de: German,
        german: German,

        it: Italian,
        italian: Italian,

        pt: Portuguese,
        portuguese: Portuguese,

        nl: Dutch,
        dutch: Dutch,
      };

      const selectedLanguage = normalizedElement.otherLanguage
        ? String(normalizedElement.localization || "en").toLowerCase()
        : "en";

      const selectedLocale =
        localeMap[selectedLanguage] || undefined;

      // ===========================================================
      // CURRENT DATE
      // ===========================================================

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ===========================================================
      // DATE BOUNDARIES
      // ===========================================================

      let minDate;
      let maxDate;

      if (normalizedElement.startDateType === "today") {
        minDate = today;
      } else if (normalizedElement.startDateType === "specificDate") {
        minDate =
          parseDateValue(normalizedElement.specificStartDate) || undefined;
      } else if (normalizedElement.startDateType === "relativeDate") {
        minDate =
          addDays(
            today,
            Number(normalizedElement.relativeStartDate) || 0
          ) || undefined;
      }

      if (normalizedElement.endDateType === "today") {
        maxDate = today;
      } else if (normalizedElement.endDateType === "specificDate") {
        maxDate =
          parseDateValue(normalizedElement.specificDate) || undefined;
      } else if (normalizedElement.endDateType === "relativeDate") {
        maxDate =
          addDays(
            today,
            Number(normalizedElement.relativeEndDate) || 0
          ) || undefined;
      }

      // ===========================================================
      // DATE RESTRICTIONS
      // ===========================================================

      const limitEnabled = Boolean(
        normalizedElement.limitDatePicker && format === "date"
      );

      const limitType = normalizedElement.limitDateType || "disable";

      const specificDates = String(
        normalizedElement.specificDates || ""
      )
        .split(",")
        .map((item) => parseDateValue(item.trim()))
        .filter(Boolean)
        .map((date) => getDateOnly(date));

      const rangeParts = String(
        normalizedElement.rangeDates || ""
      )
        .split(/\s+to\s+/i)
        .map((item) => parseDateValue(item.trim()))
        .filter(Boolean);

      const rangeStart = rangeParts[0]
        ? getDateOnly(rangeParts[0])
        : null;

      const rangeEnd = rangeParts[1]
        ? getDateOnly(rangeParts[1])
        : rangeStart;

      const selectedDays = Array.isArray(
        normalizedElement.targetDaysOfWeek
      )
        ? normalizedElement.targetDaysOfWeek.map((day) =>
          String(day).toLowerCase()
        )
        : [];

      const weekdayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];

      const hasSpecificDates = Boolean(
        limitEnabled && normalizedElement.enableSpecificDates
      );

      const hasRangeDates = Boolean(
        limitEnabled && normalizedElement.enableRangeDates
      );

      const hasWeekdays = Boolean(
        limitEnabled && normalizedElement.enableDaysOfWeek
      );

      const hasAnyRestriction =
        hasSpecificDates || hasRangeDates || hasWeekdays;

      // ===========================================================
      // DATE RANGE CHECK
      // ===========================================================

      const isDateInRange = (dateString) => {
        if (!rangeStart) return false;

        return (
          dateString >= rangeStart &&
          dateString <= (rangeEnd || rangeStart)
        );
      };

      // ===========================================================
      // CHECK CONFIGURED DATES
      // ===========================================================

      const matchesConfiguredDates = (date) => {
        const dateString = getDateOnly(date);
        const weekday = weekdayNames[date.getDay()];

        const matchesSpecific =
          hasSpecificDates &&
          specificDates.includes(dateString);

        const matchesRange =
          hasRangeDates &&
          isDateInRange(dateString);

        const matchesWeekday =
          hasWeekdays &&
          selectedDays.includes(weekday);

        return (
          matchesSpecific ||
          matchesRange ||
          matchesWeekday
        );
      };

      // ===========================================================
      // ENABLE / DISABLE DATES
      // ===========================================================

      let enableDates;
      let disableDates;

      if (limitEnabled && hasAnyRestriction) {
        if (limitType === "enable") {
          enableDates = [
            (date) => matchesConfiguredDates(date),
          ];
        } else {
          disableDates = [
            (date) => matchesConfiguredDates(date),
          ];
        }
      }

      // ===========================================================
      // MONTH ONLY
      // ===========================================================

      const onlyShowMonth = Boolean(
        normalizedElement.onlyShowMonth && format === "date"
      );

      // ===========================================================
      // SAFE PICKER VALUES
      // ===========================================================

      const currentValue =
        typeof dateValue === "string"
          ? dateValue.trim()
          : dateValue;

      const isTimeOnlyValue =
        typeof currentValue === "string" &&
        /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(currentValue);

      const isDateOnlyValue =
        typeof currentValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(currentValue);

      const dateOnlyValue = isTimeOnlyValue
        ? ""
        : currentValue || "";

      const timeOnlyValue = isDateOnlyValue
        ? ""
        : currentValue || "";

      // ===========================================================
      // DATE + TIME FORMAT
      // ===========================================================

      const combinedDateFormat =
        timeFormat === "12h"
          ? `${dateFormat} h:i K`
          : `${dateFormat} H:i`;

      // ===========================================================
      // COMMON OPTIONS
      // ===========================================================

      const commonPickerOptions = {
        clickOpens: true,
        disableMobile: true,
        allowInput: false,
        static: false,
        animate: true,

        // Apply selected language.
        ...(selectedLocale ? { locale: selectedLocale } : {}),
      };

      // ===========================================================
      // DATE ONLY OPTIONS
      // ===========================================================

      const datePickerOptions = {
        ...commonPickerOptions,

        enableTime: false,
        noCalendar: false,

        dateFormat: onlyShowMonth ? "Y-m" : dateFormat,

        minDate,
        maxDate,

        ...(enableDates ? { enable: enableDates } : {}),
        ...(disableDates ? { disable: disableDates } : {}),

        monthSelectorType: "dropdown",

        ...(onlyShowMonth
          ? {
            plugins: [
              new monthSelectPlugin({
                shorthand: false,
                dateFormat: "Y-m",
                altFormat: "F Y",
                theme: "light",
              }),
            ],
          }
          : {}),
      };

      // ===========================================================
      // DATE + TIME OPTIONS
      // ===========================================================

      const dateTimePickerOptions = {
        ...commonPickerOptions,

        enableTime: true,
        noCalendar: false,

        dateFormat: combinedDateFormat,

        time_24hr: timeFormat !== "12h",
        minuteIncrement: timeStep,

        minDate,
        maxDate,

        monthSelectorType: "dropdown",
      };

      // ===========================================================
      // TIME ONLY OPTIONS
      // ===========================================================

      const timePickerOptions = {
        ...commonPickerOptions,

        enableTime: true,
        noCalendar: true,

        dateFormat:
          timeFormat === "12h" ? "h:i K" : "H:i",

        time_24hr: timeFormat !== "12h",
        minuteIncrement: timeStep,

        defaultHour: 12,
        defaultMinute: 0,
      };

      // ===========================================================
      // TIME DROPDOWN OPTIONS
      // ===========================================================

      const timeOptions = getTimeOptions(normalizedElement);

      // ===========================================================
      // UPDATE VALUE
      // ===========================================================

      // UPDATE VALUE

      const updateDateValue = (nextValue) => {
        const safeValue = nextValue ?? "";

        setDateValue(safeValue);
        reportChange(safeValue);
      };

      // ===========================================================
      // RENDER
      // ===========================================================

      return (
        <BlockStack gap="300">
          {!hideLabel && fieldLabelWithIcon}

          {/* DATE + TIME */}

          {format === "date_time" && (
            <FlatpickrField
              key={`combined-date-time-${selectedLanguage}`}
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
              key={`date-picker-${selectedLanguage}-${onlyShowMonth ? "month" : "day"}`}
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
              key={`time-picker-${selectedLanguage}`}
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
      const min = normalizedElement.setMinValue
        ? Number(normalizedElement.minValue)
        : undefined;

      const max = normalizedElement.setMaxValue
        ? Number(normalizedElement.maxValue)
        : undefined;

      const handleNumberChangeWithLimits = (nextValue) => {
        if (nextValue === "") {
          updateValue("");
          setNumberError("");
          return;
        }

        const numericValue = Number(nextValue);

        if (!Number.isFinite(numericValue)) return;

        if (min !== undefined && numericValue < min) {
          updateValue(String(min));
        } else if (max !== undefined && numericValue > max) {
          updateValue(String(max));
        } else {
          updateValue(nextValue);
        }

        setNumberError("");
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
    normalizedElement.setMinValue && Number.isFinite(parsedMin)
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

  const safeValue = Math.min(max, Math.max(min, currentValue));

  const decreaseValue = () => {
    if (isReadOnly || safeValue <= min) return;
    updateValue(String(Math.max(min, safeValue - 1)));
  };

  const increaseValue = () => {
    if (isReadOnly || safeValue >= max) return;
    updateValue(String(Math.min(max, safeValue + 1)));
  };

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
          disabled={isReadOnly || safeValue <= min}
          onClick={decreaseValue}
          style={{
            ...buttonStyle,
            color: safeValue <= min ? "#C9CCCF" : "#303030",
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
          disabled={isReadOnly || safeValue >= max}
          onClick={increaseValue}
          style={{
            ...buttonStyle,
            color: safeValue >= max ? "#C9CCCF" : "#303030",
            cursor:
              isReadOnly || safeValue >= max
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
      // ============================================================
      // 1. MINIMUM AND MAXIMUM SETTINGS
      // ============================================================

      const parsedMin = Number(normalizedElement.minItems);
      const parsedMax = Number(normalizedElement.maxItems);

      const minItems =
        normalizedElement.minItems !== undefined &&
          normalizedElement.minItems !== "" &&
          Number.isFinite(parsedMin)
          ? Math.max(1, Math.floor(parsedMin))
          : 1;

      const maxItems =
        normalizedElement.maxItems !== undefined &&
          normalizedElement.maxItems !== "" &&
          Number.isFinite(parsedMax)
          ? Math.max(minItems, Math.floor(parsedMax))
          : Math.max(5, minItems);

      // ============================================================
      // 2. CURRENT REPEATER VALUES
      // ============================================================

      const items = repeaterItems;

      const filledItemsCount = items.filter(
        (item) => String(item ?? "").trim() !== ""
      ).length;

      const hasMinItemsError = filledItemsCount < minItems;

      const addButtonText =
        normalizedElement.addButtonText || "Add more";

      // ============================================================
      // 3. ADD ITEM
      // ============================================================

      const handleAddItem = () => {
        if (isReadOnly || items.length >= maxItems) return;

        updateRepeaterValue([
          ...items,
          "",
        ]);
      };

      // ============================================================
      // 4. REMOVE ITEM
      // ============================================================

      const handleRemoveItem = (index) => {
        if (isReadOnly || items.length <= minItems) return;

        const updatedItems = items.filter(
          (_, itemIndex) => itemIndex !== index
        );

        updateRepeaterValue(updatedItems);
      };

      // ============================================================
      // 5. UPDATE ITEM
      // ============================================================

      const handleItemChange = (index, newValue) => {
        if (isReadOnly) return;

        const updatedItems = [...items];

        updatedItems[index] = newValue;

        updateRepeaterValue(updatedItems);
      };

      // ============================================================
      // 6. RENDER
      // ============================================================

      return (
        <BlockStack gap="200">

          {fieldLabelWithIcon}

          {/* Repeater input rows */}
          {items.map((item, index) => (
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

          {/* Add button */}
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

          {/* Item count */}
          <Text
            as="p"
            variant="bodySm"
            tone="subdued"
          >
            {items.length} / {maxItems} items
          </Text>

          {/* Minimum validation */}
          {hasMinItemsError && (
            <Text
              as="p"
              variant="bodySm"
              tone="critical"
            >
              Minimum {minItems} items required.
              Please enter at least {minItems} values.
            </Text>
          )}

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
                onClick={() => {
                  setRating(n);
                  reportChange(n);
                }}
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
                    onClick={() => {
                      setRating(star);
                      reportChange(star);
                    }}
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
    // FEEDBACK
    // -------------------------------------------------------

    case "feedback": {
      const feedbackStyles = {
        experience: ["😡", "🙁", "😐", "🙂", "😍"],
        satisfaction: ["😞", "😕", "😐", "😊", "🤩"],
        agreement: ["👎", "🙅", "🤷", "👍", "💯"],
        effort: ["😫", "😓", "😐", "😌", "💪"],
        likelihood: ["🚫", "🙁", "🤔", "🙂", "🚀"],
      };

      const emojis =
        feedbackStyles[normalizedElement.feedbackStyle] ||
        feedbackStyles.experience;

      const allowMultiple = Boolean(normalizedElement.allowMultiple);

      const maxSelections = Number(normalizedElement.maxSelections);

      const selectedValues = Array.isArray(selected)
        ? selected
        : selected
          ? [selected]
          : [];

      const handleFeedbackSelection = (emoji) => {
        if (isReadOnly) return;

        const alreadySelected = selectedValues.includes(emoji);

        let updatedValues;

        if (allowMultiple) {
          if (alreadySelected) {
            updatedValues = selectedValues.filter(
              (item) => item !== emoji
            );
          } else {
            if (
              maxSelections > 0 &&
              selectedValues.length >= maxSelections
            ) {
              return;
            }

            updatedValues = [...selectedValues, emoji];
          }
        } else {
          updatedValues = [emoji];
        }

        setSelected(updatedValues);
        reportChange(updatedValues);
      };

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
              {emojis.map((emoji, index) => {
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
                      onClick={() => {
                        const updatedFiles = selectedFiles.filter(
                          (_, fileIndex) => fileIndex !== index
                        );

                        setSelectedFiles(updatedFiles);
                        reportChange(updatedFiles);
                      }}
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
                          reportChange(updatedImages);
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
                    reportChange(updatedImages);

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
                onClick={() => {
                  setColorValue(color);
                  reportChange(color);
                }}
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
              onChange={(newColor) => {
                setColorValue(newColor);
                reportChange(newColor);
              }}
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
              reportChange(newValue);
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

        let updatedValues;

        const alreadySelected = selectedValues.includes(answerValue);

        if (allowMultiple) {
          if (alreadySelected) {
            updatedValues = selectedValues.filter(
              (item) => item !== answerValue
            );
          } else {
            updatedValues = [...selectedValues, answerValue];
          }
        } else {
          updatedValues = [
            ...selectedValues.filter(
              (item) =>
                !String(item).startsWith(questionPrefix)
            ),
            answerValue,
          ];
        }

        setSelected(updatedValues);
        reportChange(updatedValues);
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
              onClick={() => {
                setSwitchValue((previous) => {
                  const nextValue = !previous;
                  reportChange(nextValue);
                  return nextValue;
                });
              }}
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
                          updateValue(optionValue);
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

                          let nextSelected;

                          if (normalizedElement.allowMultiple) {
                            nextSelected = isSelected
                              ? selected.filter(
                                (id) => id !== product.id
                              )
                              : [...selected, product.id];
                          } else {
                            nextSelected = isSelected
                              ? []
                              : [product.id];
                          }

                          setSelected(nextSelected);
                          reportChange(nextSelected);
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
    //text
    case "text": {
      const maxLength = Number(normalizedElement.maxLength ?? 100);

      const hasCharacterLimit =
        normalizedElement.enableCharacterLimit === true;

      const numbersOnly = normalizedElement.numbersOnly === true;
      const nameValidation = normalizedElement.nameValidation === true;

      return (
        <BlockStack gap="200">
          {fieldLabelWithIcon}

          <TextField
            value={value || ""}
            placeholder={placeholder || ""}
            disabled={isReadOnly}
            autoComplete="off"
            maxLength={
              hasCharacterLimit && maxLength > 0
                ? maxLength
                : undefined
            }

            /* 
                error={
                  nameValidation &&
                    value &&
                    !/^[a-zA-Z\s'-]*$/.test(value)
                    ? "Please enter a valid name."
                    : undefined
                }
                */


            onChange={(newValue) => {
              let updatedValue = newValue;

              // Numbers only
              if (numbersOnly) {
                updatedValue = updatedValue.replace(/[^0-9]/g, "");
              }

              // Name validation
              if (nameValidation) {
                updatedValue = updatedValue.replace(
                  /[^a-zA-Z\s'-]/g,
                  ""
                );
              }

              // Maximum character limit
              if (hasCharacterLimit && maxLength > 0) {
                updatedValue = updatedValue.slice(0, maxLength);
              }

              setValue(updatedValue);
              reportChange(updatedValue);
            }}
          />

          {descriptionText}
        </BlockStack>
      );
    }
    //textaera 
    case "textarea": {
      const minCharacters = Number(
        normalizedElement.minCharacters || 0
      );

      const maxCharacters = Number(
        normalizedElement.maxCharacters || 0
      );

      const hasCharacterLimit =
        normalizedElement.limitCharacters === true;

      const characterCount = (value || "").length;

      // const minError =
      //   hasCharacterLimit &&
      //   minCharacters > 0 &&
      //   characterCount > 0 &&
      //   characterCount < minCharacters;

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
              hasCharacterLimit && maxCharacters > 0
                ? maxCharacters
                : undefined
            }

            // error={
            //   minError
            //     ? `Please enter at least ${minCharacters} characters.`
            //     : undefined
            // }

            onChange={(newValue) => {
              let updatedValue = newValue;

              // Maximum character limit
              if (
                hasCharacterLimit &&
                maxCharacters > 0
              ) {
                updatedValue = updatedValue.slice(
                  0,
                  maxCharacters
                );
              }

              setValue(updatedValue);
              reportChange(updatedValue);
            }}
          />

          {hasCharacterLimit && (
            <Text as="p" variant="bodySm" tone="subdued">
              {characterCount}
              {maxCharacters > 0
                ? ` / ${maxCharacters}`
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