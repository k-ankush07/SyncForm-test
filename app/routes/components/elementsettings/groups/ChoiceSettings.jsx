
import React from "react";

import {
  BlockStack,
  TextField,
  Checkbox,
  Select,
} from "@shopify/polaris";

export default function ChoiceSettings({ element, onChange }) {

    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isCheckbox = [
        "checkbox",
        "checkbox_group",
        "checkboxes",
    ].includes(type);

    const isRadio = [
        "radio",
        "radio_group",
    ].includes(type);

    const isDropdown = [
        "dropdown",
        "select",
    ].includes(type);

    console.log("Element type:", element.type);
    console.log("Normalized type:", type);

    // Update one setting without losing other element properties.
    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    // Support options stored as objects.
    const options = Array.isArray(element.options)
        ? element.options
        : [];

    const optionChoices = options.map((option) => ({
        label: option.label,
        value: option.value,
    }));

    const defaultValueOptions = [
        { label: "Please select", value: "" },
        ...optionChoices,
    ];

    return (
        <BlockStack gap="400">

            {/* =================================
                DROPDOWN SETTINGS
            ================================= */}

            {isDropdown && (
                <>
                    {/* ENABLE SEARCH */}
                    <Checkbox
                        label="Enable search"
                        checked={Boolean(element.selectWithSearch)}
                        onChange={(value) =>
                            update("selectWithSearch", value)
                        }
                    />

                    {/* SELECT ICON */}
                    <TextField
                        label="Select icon"
                        value={element.selectIcon || ""}
                        onChange={(value) =>
                            update("selectIcon", value)
                        }
                        placeholder="Enter icon name"
                        autoComplete="off"
                    />

                    {/* DEFAULT VALUE */}
                    <Select
                        label="Select default value"
                        options={defaultValueOptions}
                        value={element.defaultOption || ""}
                        onChange={(value) =>
                            update("defaultOption", value)
                        }
                    />
                </>
            )}

            {/* =================================
                RADIO SETTINGS
            ================================= */}

            {isRadio && (
                <Select
                    label="Select default value"
                    options={defaultValueOptions}
                    value={element.defaultOption || ""}
                    onChange={(value) =>
                        update("defaultOption", value)
                    }
                />
            )}

            {/* =================================
                CHECKBOX SETTINGS
            ================================= */}

            {isCheckbox && (
                <BlockStack gap="300">

                    <TextField
                        label="Enter default value"
                        value={element.defaultOptions || ""}
                        onChange={(value) =>
                            update("defaultOptions", value)
                        }
                        multiline={3}
                        autoComplete="off"
                    />

                    {/* LIMIT SELECTIONS */}
                    <Checkbox
                        label="Limit selections"
                        checked={Boolean(element.limitSelections)}
                        onChange={(value) =>
                            update("limitSelections", value)
                        }
                    />

                    {element.limitSelections && (
                        <BlockStack gap="300">

                            <TextField
                                label="Min selections"
                                type="number"
                                value={String(element.minSelections ?? "")}
                                onChange={(value) =>
                                    update("minSelections", value)
                                }
                                autoComplete="off"
                            />

                            <TextField
                                label="Max selections"
                                type="number"
                                value={String(element.maxSelections ?? "")}
                                onChange={(value) =>
                                    update("maxSelections", value)
                                }
                                autoComplete="off"
                            />

                        </BlockStack>
                    )}

                </BlockStack>
            )}

        </BlockStack>
    );
}
