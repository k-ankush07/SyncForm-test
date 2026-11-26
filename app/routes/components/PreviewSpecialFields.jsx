// sharaed styles for the consent Quantioy and button 
import "./PreviewSpecialFields.css";
import { useEffect, useState } from "react";

export function PreviewQuantity({
  label,
  required,
  hideLabel = false,
  description,
  value,
  min = 0,
  max = 999,
  isReadOnly,
  onDecrease,
  onIncrease,
  onChange,
}) {
  const [inputValue, setInputValue] = useState(String(value ?? min));

  // Sync input whenever the parent value changes
  useEffect(() => {
    setInputValue(String(value ?? min));
  }, [value, min]);

  const safeMin = Number.isFinite(Number(min)) ? Number(min) : 0;
  const safeMax = Number.isFinite(Number(max))
    ? Number(max)
    : Infinity;

  const numericValue = Number(value ?? safeMin);

  const isMin = numericValue <= safeMin;
  const isMax = numericValue >= safeMax;

  // -------------------------------------------------------
  // HANDLE MANUAL INPUT
  // -------------------------------------------------------

const handleInputChange = (event) => {
  const nextValue = event.target.value;

  if (nextValue === "") {
    setInputValue("");
    return;
  }

  const nextNumber = Number(nextValue);

  if (!Number.isFinite(nextNumber)) return;

  // Clamp immediately using the actual min/max
  const clampedValue = Math.min(
    safeMax,
    Math.max(safeMin, nextNumber)
  );

  setInputValue(String(clampedValue));

  // Send the already-clamped value to the hook
  onChange?.(String(clampedValue));
};

  // -------------------------------------------------------
  // RESTORE VALUE WHEN INPUT IS EMPTY
  // -------------------------------------------------------
const handleInputBlur = () => {
  if (inputValue.trim() === "") {
    setInputValue(String(value ?? safeMin));
    return;
  }

  const numericValue = Number(inputValue);

  const clampedValue = Math.min(
    safeMax,
    Math.max(safeMin, numericValue)
  );

  setInputValue(String(clampedValue));
  onChange?.(String(clampedValue));
};

  return (
    <div className="preview-input-shell-wrapper">
      {!hideLabel && label && (
        <div className="preview-input-shell__label">
          {label}
          {required && (
            <span className="preview-input-shell__required">
              {" "}*
            </span>
          )}
        </div>
      )}

      <div className="preview-input-shell preview-quantity-shell">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={isReadOnly || isMin}
          onClick={onDecrease}
        >
          −
        </button>

        <input
          type="number"
          className="preview-quantity-value"
          value={inputValue}
          min={safeMin}
          max={Number.isFinite(safeMax) ? safeMax : undefined}
          step="1"
          disabled={isReadOnly}
          aria-label={label || "Quantity"}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
        />

        <button
          type="button"
          aria-label="Increase quantity"
          disabled={isReadOnly || isMax}
          onClick={onIncrease}
        >
          +
        </button>
      </div>

      {description && (
        <div className="preview-input-shell__description">
          {description}
        </div>
      )}
    </div>
  );
}


export function PreviewButton({
  options = [],
  selectedValues = [],
  otherOption,
  otherChecked,
  otherLabel,
  otherPlaceholder,
  otherValue,
  isReadOnly,
  onChange,
  onOtherTextChange,
  description,
}) {
  return (
    <div className="preview-special-button-wrapper">
      <div className="preview-special-button-options">
        {options.map((option, index) => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <button
              key={option.id || index}
              type="button"
              className={`preview-special-button ${
                isSelected ? "is-selected" : ""
              }`}
              disabled={isReadOnly}
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}

        {otherOption && (
          <button
            type="button"
            className={`preview-special-button ${
              otherChecked ? "is-selected" : ""
            }`}
            disabled={isReadOnly}
            aria-pressed={otherChecked}
            onClick={() => onChange("__other__")}
          >
            {otherLabel || "Other"}
          </button>
        )}
      </div>

      {otherOption && otherChecked && (
        <input
          type="text"
          className="preview-special-button-other-input"
          placeholder={otherPlaceholder || "Please specify"}
          value={otherValue}
          disabled={isReadOnly}
          onChange={(event) => onOtherTextChange(event.target.value)}
          autoComplete="off"
        />
      )}

      {description && (
        <div className="preview-input-shell__description">
          {description}
        </div>
      )}
    </div>
  );
}
//consent

export function PreviewConsent({
  label,
  checked,
  isReadOnly,
  onChange,
  sanitizeHTML,
  description,
}) {
  return (
    <div className="preview-consent-wrapper">
      <label className="preview-consent">
        <input
          type="checkbox"
          checked={checked}
          disabled={isReadOnly}
          onChange={(event) => onChange(event.target.checked)}
          className="preview-consent__input"
        />

        <span className="preview-consent__checkbox">
          {checked && (
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8L6.5 11.5L13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <span
          className="preview-consent__label rich-text-preview"
          dangerouslySetInnerHTML={{
            __html: sanitizeHTML(
              label || "<p>I agree to terms and conditions.</p>"
            ),
          }}
        />
      </label>

      {description && (
        <div className="preview-input-shell__description">
          {description}
        </div>
      )}
    </div>
  );
}
