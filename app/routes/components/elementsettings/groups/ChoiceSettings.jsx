
import React from "react";

import {
  BlockStack,
  Checkbox,
  Select,
  TextField,
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

  const update = (key, value) => {
    onChange({
      ...element,
      [key]: value,
    });
  };

  const optionList = (element.options || []).map((option) => ({
    label: option.label,
    value: option.value,
  }));

  const optionsPerLineOptions = [
  { label: "1 per line", value: "1" },
  { label: "2 per line", value: "2" },
  { label: "3 per line", value: "3" },
  { label: "4 per line", value: "4" },
  { label: "5 per line", value: "5" },
];

  return (
    <BlockStack gap="400">

      {/* DROPDOWN SETTINGS */}
      {isDropdown && (
        <Checkbox
          label="Enable search"
          checked={Boolean(element.selectWithSearch)}
          onChange={(value) =>
            update("selectWithSearch", value)
          }
        />
      )}

      {/* RADIO SETTINGS */}
      {isRadio && (
        <Select
          label="Select default value"
          options={[
            { label: "Please select", value: "" },
            ...optionList,
          ]}
          value={element.defaultValue || ""}
          onChange={(value) =>
            update("defaultValue", value)
          }
        />
      )}

      {/* CHECKBOX SETTINGS */}
      {isCheckbox && (
        <>
          <Checkbox
            label="Limit selections"
            checked={Boolean(element.limitSelections)}
            onChange={(value) =>
              update("limitSelections", value)
            }
          />

          {element.limitSelections && (
            <>
              {/* Keep your existing minimum and maximum
                  selection inputs here. */}
            </>
          )}
        </>
      )}

    </BlockStack>
  );
}
