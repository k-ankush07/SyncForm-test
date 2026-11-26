
import React from "react";
function PreviewTextInput({
  value = "",
  onChange,
  type = "text",
  placeholder = "",
  autoComplete,
  inputMode,
  readOnly = false,
  disabled = false,
  error,
  minLength,
  maxLength,
  suffix,
  min,
  max,
  step,
  name,
  id,
  required = false,
}) {
  return (
    <div className="preview-text-input-wrapper">
      <div className="preview-text-input__container">
        <input
          className="preview-text-input"
          id={id}
          name={name}
          type={type}
          value={value}
          inputMode={inputMode}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={readOnly}
          disabled={disabled}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
        />

        {suffix && (
          <div className="preview-text-input__suffix">
            {suffix}
          </div>
        )}
      </div>

      {error && (
        <div className="preview-text-input__error">
          {error}
        </div>
      )}
    </div>
  );
}

export default PreviewTextInput;
