import React, { useState } from "react";

import {
    Text,
    Divider,
    TextField,
    Checkbox,
    Select,
    ChoiceList,
    DropZone,
    Button,
} from "@shopify/polaris";

export default function PreviewField({ element, field }) {
    const [checked, setChecked] = useState(false);
    const [selected, setSelected] = useState([]);
    const [value, setValue] = useState("");
    const [dateValue, setDateValue] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [rangeValue, setRangeValue] = useState(50);
    const [colorValue, setColorValue] = useState("#563D7C");
    const [rating, setRating] = useState(0);

    // Support both old and new props.
    const currentElement = element ?? field;

    if (!currentElement) return null;

    // Normalize strings such as "File Upload" into "file_upload".
    const normalizedElement =
        typeof currentElement === "string"
            ? {
                  type: currentElement
                      .toLowerCase()
                      .trim()
                      .replace(/[\s-]+/g, "_"),
                  label: currentElement,
              }
            : currentElement;

    const type = normalizedElement.type
        ?.toLowerCase()
        .replace(/[\s-]+/g, "_");

    const label =
        normalizedElement.label ||
        normalizedElement.name ||
        "Untitled field";

    const options = (
        normalizedElement.options?.length
            ? normalizedElement.options
            : [
                  { label: "Option 1", value: "option1" },
                  { label: "Option 2", value: "option2" },
              ]
    ).map((option) =>
        typeof option === "string"
            ? { label: option, value: option }
            : option
    );

    switch (type) {
        // CONTACT INFO

        case "email":
            return (
                <TextField
                    label={label}
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
                    label={label}
                    autoComplete="given-name"
                    value={value}
                    onChange={setValue}
                />
            );

        case "last_name":
            return (
                <TextField
                    label={label}
                    autoComplete="family-name"
                    value={value}
                    onChange={setValue}
                />
            );

        case "phone":
            return (
                <TextField
                    label={label}
                    type="tel"
                    autoComplete="tel"
                    value={value}
                    onChange={setValue}
                />
            );

        case "password":
            return (
                <TextField
                    label={label}
                    type="password"
                    autoComplete="new-password"
                    value={value}
                    onChange={setValue}
                />
            );

        case "country":
            return (
                <Select
                    label={label}
                    options={[
                        { label: "Select country", value: "" },
                        { label: "India", value: "IN" },
                        { label: "United States", value: "US" },
                        { label: "United Kingdom", value: "GB" },
                    ]}
                    value={value}
                    onChange={setValue}
                />
            );

        // SELECTS

        case "checkboxes":
        case "checkbox_group":
            return (
                <ChoiceList
                    title={label}
                    allowMultiple
                    choices={options}
                    selected={selected}
                    onChange={setSelected}
                />
            );

        case "dropdown":
        case "select":
        case "image_dropdown":
            return (
                <Select
                    label={label}
                    options={[
                        { label: "Choose an option", value: "" },
                        ...options,
                    ]}
                    value={value}
                    onChange={setValue}
                />
            );

        case "radio":
        case "radio_button":
            return (
                <ChoiceList
                    title={label}
                    choices={options}
                    selected={selected}
                    onChange={setSelected}
                />
            );

        case "consent":
        case "checkbox":
        case "switch":
            return (
                <Checkbox
                    label={label}
                    checked={checked}
                    onChange={setChecked}
                />
            );

        case "image_options":
            return (
                <ChoiceList
                    title={label}
                    allowMultiple
                    choices={options}
                    selected={selected}
                    onChange={setSelected}
                />
            );

        case "button":
            return (
                <Button onClick={() => {}}>
                    {label}
                </Button>
            );

        case "product":
            return (
                <TextField
                    label={label}
                    placeholder="Search products"
                    value={value}
                    onChange={setValue}
                    autoComplete="off"
                />
            );

        // INPUT

        case "url":
            return (
                <TextField
                    label={label}
                    type="url"
                    placeholder="https://example.com"
                    value={value}
                    onChange={setValue}
                />
            );

        case "date":
            return (
                <TextField
                    label={label}
                    type="date"
                    value={dateValue}
                    onChange={setDateValue}
                />
            );

        case "hidden":
            return null;

        case "repeater":
            return (
                <TextField
                    label={label}
                    placeholder="Repeater preview"
                    value={value}
                    onChange={setValue}
                    autoComplete="off"
                />
            );

        case "signature":
            return (
                <div>
                    <Text as="p" variant="bodyMd">
                        {label}
                    </Text>
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
                </div>
            );

        // STATIC TEXT

        case "heading":
            return (
                <Text as="h2" variant="headingMd">
                    {label}
                </Text>
            );

        case "paragraph":
            return (
                <Text as="p" variant="bodyMd">
                    {normalizedElement.content || label}
                </Text>
            );

        case "html":
            return (
                <Text as="p" variant="bodyMd">
                    {normalizedElement.content || label}
                </Text>
            );

        case "divider":
            return <Divider />;

        // TEXT

        case "text":
        case "short_text":
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={setValue}
                    autoComplete="off"
                />
            );

        case "textarea":
            return (
                <TextField
                    label={label}
                    multiline={3}
                    value={value}
                    onChange={setValue}
                    autoComplete="off"
                />
            );

        // NUMBER

        case "number":
        case "quantity":
            return (
                <TextField
                    label={label}
                    type="number"
                    value={value}
                    onChange={setValue}
                    autoComplete="off"
                />
            );

        // RATINGS

        case "feedback":
        case "matrix":
        case "rating_level":
            return (
                <ChoiceList
                    title={label}
                    choices={options}
                    selected={selected}
                    onChange={setSelected}
                />
            );

        case "rating_star":
            return (
                <div>
                    <Text as="p" variant="bodyMd">
                        {label}
                    </Text>

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "8px",
                        }}
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                aria-label={`${star} star${star > 1 ? "s" : ""}`}
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
                </div>
            );

        // FILE UPLOAD

        case "file_upload":
            return (
                <div>
                    <Text as="p" variant="bodyMd">
                        {label}
                    </Text>

                    <div style={{ marginTop: "8px" }}>
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
                                    actionTitle="Add file"
                                    actionHint="or drop a file to upload"
                                />
                            )}
                        </DropZone>
                    </div>
                </div>
            );

        // COLOR

        case "color_swatch":
            return (
                <div>
                    <Text as="p" variant="bodyMd">
                        {label}
                    </Text>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            marginTop: "8px",
                        }}
                    >
                        {["#E53935", "#1E88E5", "#43A047", "#FDD835"].map(
                            (color) => (
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
                            )
                        )}
                    </div>
                </div>
            );

        case "color_picker":
            return (
                <div>
                    <Text as="p" variant="bodyMd">
                        {label}
                    </Text>

                    <input
                        type="color"
                        value={colorValue}
                        onChange={(event) => setColorValue(event.target.value)}
                        style={{
                            width: "60px",
                            height: "40px",
                            marginTop: "8px",
                            cursor: "pointer",
                        }}
                    />
                </div>
            );

        // RANGE SLIDER

        case "range_slider":
            return (
                <div>
                    <Text as="p" variant="bodyMd">
                        {label}
                    </Text>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={rangeValue}
                        onChange={(event) =>
                            setRangeValue(Number(event.target.value))
                        }
                        style={{ width: "100%", marginTop: "8px" }}
                    />

                    <Text as="p" variant="bodySm">
                        {rangeValue}
                    </Text>
                </div>
            );

        default:
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={setValue}
                    autoComplete="off"
                />
            );
    }
}