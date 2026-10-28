
import React, { useState } from "react";

import {
    Text,
    Divider,
    TextField,
    Checkbox,
    Select,
    ChoiceList,
} from "@shopify/polaris";

export default function PreviewField({ element, field }) {
    const [checked, setChecked] = useState(false);
    const [selected, setSelected] = useState([]);
    const [value, setValue] = useState("");
    const [dateValue, setDateValue] = useState("");

    // Support both the old field prop and the new element prop.
    const currentElement = element ?? field;

    if (!currentElement) return null;

    // Convert existing string fields into element objects.
    const normalizedElement =
        typeof currentElement === "string"
            ? {
                  type: currentElement.toLowerCase().replace(/\s+/g, "-"),
                  label: currentElement,
              }
            : currentElement;

    const type = normalizedElement.type?.toLowerCase();
    const label = normalizedElement.label || normalizedElement.name || "Untitled field";

    const options = normalizedElement.options?.map((option) =>
        typeof option === "string"
            ? { label: option, value: option }
            : option
    ) || [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
    ];

    switch (type) {
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
        case "first-name":
            return (
                <TextField
                    label={label}
                    autoComplete="given-name"
                    value={value}
                    onChange={setValue}
                />
            );

        case "last-name":
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
                    value={value}
                    onChange={setValue}
                />
            );

        case "password":
            return (
                <TextField
                    label={label}
                    type="password"
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

        case "checkboxes":
        case "checkbox-group":
            return (
                <ChoiceList
                    title={label}
                    allowMultiple
                    choices={options.map(({ label, value }) => ({
                        label,
                        value,
                    }))}
                    selected={selected}
                    onChange={setSelected}
                />
            );

        case "dropdown":
        case "select":
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
        case "radio-button":
            return (
                <ChoiceList
                    title={label}
                    choices={options.map(({ label, value }) => ({
                        label,
                        value,
                    }))}
                    selected={selected}
                    onChange={setSelected}
                />
            );

        case "consent":
        case "checkbox":
            return (
                <Checkbox
                    label={label}
                    checked={checked}
                    onChange={setChecked}
                />
            );

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

        case "heading":
            return (
                <Text as="h2" variant="headingMd">
                    {label}
                </Text>
            );

        case "paragraph":
            return (
                <Text as="p" variant="bodyMd">
                    {label}
                </Text>
            );

        case "divider":
            return <Divider />;

        case "textarea":
            return (
                <TextField
                    label={label}
                    multiline={3}
                    value={value}
                    onChange={setValue}
                />
            );

        case "text":
        case "short-text":
        default:
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={setValue}
                />
            );
    }
}
