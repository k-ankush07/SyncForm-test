
import React from "react";
import "./preview-text-input.css";
function PreviewTextInput({
    value = "",
    onChange,
    type = "text",
    placeholder = "",
    autoComplete,
    readOnly = false,
    disabled = false,
    error,
    minLength,
    maxLength,
    suffix
}) {
   return (
  <div className="preview-text-input-wrapper">
    <div className="preview-text-input__container">
      <input
        className="preview-text-input"
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        readOnly={readOnly}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
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
