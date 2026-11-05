
import React, { useState } from "react";
import SelectIcon from "./SelectIcon";
import { Icon } from "@shopify/polaris";
import * as PolarisIcons from "@shopify/polaris-icons";
import { countries } from "../components/elementsettings/utils/countries.js";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import {
    BlockStack,
    TextField,
    Checkbox,
    Divider,
    Text,
    Box,
    InlineStack,
    Button,
    Select,
    ButtonGroup
} from "@shopify/polaris";

import ContactSettings from "./elementsettings/groups/ContactSettings";
import TextSettings from "./elementsettings/groups/TextSettings";
import ChoiceSettings from "./elementsettings/groups/ChoiceSettings";
import NumberSettings from "./elementsettings/groups/NumberSettings";
import DateSettings from "./elementsettings/groups/DateSettings";
import FileSettings from "./elementsettings/groups/FileUploadSettings";
import StaticTextSettings from "./elementsettings/groups/StaticTextSettings";
import RatingStarSettings from "./elementsettings/groups/RatingStarSettings";
import HeaderFooterSettings from "./elementsettings/groups/HeaderFooterSettings";
import ButtonSettings from "./elementsettings/groups/ButtonSettings";
import { getElementSettingsType } from "./elementsettings/utils/elementSettingsConfig";


/* =========================================
   COMMON SETTINGS - ALL ELEMENTS
========================================= */

function CommonSettings({ element, onChange, onOpenSelectIcon }) {

    const [optionsExpanded, setOptionsExpanded] = useState(true);
    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [bulkOptionsText, setBulkOptionsText] = useState("");

    // UPDATE ELEMENT
    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    // NORMALIZE ELEMENT TYPE
    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    // Check whether the selected element is Header or Footer.
    const isHeaderFooter = [
        "form_header",
        "form_footer",
    ].includes(type);

    // Header and Footer have their own settings.
    // The parent ElementSettings component already provides
    // the main wrapper and scrollable content area.
    // Therefore, do not create another wrapper here.
    if (isHeaderFooter) {
        return (
            <BlockStack gap="400">
                <HeaderFooterSettings
                    element={element}
                    onChange={onChange}
                />
            </BlockStack>
        );
    }

    // CONTACT TYPES
    const isName = ["name", "first_name", "last_name"].includes(type);
    const isEmail = type === "email";
    const isPhone = ["phone", "tel"].includes(type);
    const isPassword = type === "password";
    const isCountry = type === "country";

    const isContactInput =
        isName || isEmail || isPhone || isPassword;

    // CHOICE TYPES
    const isDropdown = ["dropdown", "select"].includes(type);
    const isRadio = ["radio", "radio_group"].includes(type);

    const isCheckbox = [
        "checkbox",
        "checkbox_group",
        "checkboxes",
    ].includes(type);

    //is button
    const isButton = type === "button";

    const isChoiceInput =
        isDropdown || isRadio || isCheckbox || isButton;

    // STATIC TEXT TYPES
    const isHeading = type === "heading";
    const isParagraph = type === "paragraph";
    const isDivider = type === "divider";

    // TEXT and Textarea
    const isStaticText = [
        "heading",
        "paragraph",
        "divider",
    ].includes(type);

    // URL and FILE
    const isFileUpload = type === "file_upload";
    const isUrl = type === "url";

    // STAR RATING
    const isStarRating = [
        "rating",
        "rating_star",
        "star_rating",
    ].includes(type);

    // NUMBER
    const isNumber = type === "number";
    const isQuantity = type === "quantity";

    // DATE AND TIME
    const isDateTime = [
        "date",
        "date_time",
        "datetime",
        "time",
    ].includes(type);



    // CONDITIONAL SETTINGS
    const showDefaultValue =
        isName || isEmail || isPhone || isChoiceInput || isCountry;

    const showKeepLabelPosition =
        isName || isEmail || isPhone || isPassword ||
        isChoiceInput || isCountry || isStarRating;

    const showCharacterLimit = isContactInput;

    const showSelectIcon =
        isContactInput || isDropdown || isCountry || isUrl || isNumber;

    const showRequiredNote =
        isContactInput || isChoiceInput || isStarRating;

    const showOtherOption = isRadio || isCheckbox;
    const showLimitSelections = isCheckbox;

    // CHOICE OPTIONS DATA
    const options = Array.isArray(element.options)
        ? element.options
        : [];

    // ADD OPTION
    const addOption = () => {
        const newIndex = options.length + 1;

        const newOption = {
            id: `option-${Date.now()}`,
            label: `Option ${newIndex}`,
            value: `option_${newIndex}`,
        };

        update("options", [...options, newOption]);
    };

    // UPDATE OPTION
    const updateOption = (index, value) => {
        const updatedOptions = options.map((option, i) =>
            i === index
                ? {
                    ...option,
                    label: value,
                    value: value,
                }
                : option
        );

        update("options", updatedOptions);
    };

    // DELETE OPTION
    const deleteOption = (index) => {
        const updatedOptions = options.filter(
            (_, i) => i !== index
        );

        update("options", updatedOptions);
    };

    // BULK ADD OPTIONS
    const bulkAddOptions = () => {
        const newOptions = bulkOptionsText
            .split("\n")
            .map((label) => label.trim())
            .filter(Boolean)
            .map((label, index) => ({
                id: `option-${Date.now()}-${index}`,
                label,
                value: label,
            }));

        if (newOptions.length > 0) {
            update("options", [...options, ...newOptions]);
        }

        setBulkOptionsText("");
        setBulkAddOpen(false);
    };


    // CHOICE SETTINGS
    const renderChoiceSettings = () => {
        if (!isChoiceInput) return null;

        return (
            <BlockStack gap="300">

                {/* OPTIONS */}

                <Box
                    borderColor="border"
                    borderWidth="025"
                    borderRadius="200"
                    padding="200"
                >
                    <BlockStack gap="300">

                        <InlineStack
                            align="space-between"
                            blockAlign="center"
                        >
                            <Text variant="bodyMd">
                                Options
                            </Text>

                            <Button
                                variant="plain"
                                onClick={() =>
                                    setOptionsExpanded(!optionsExpanded)
                                }
                            >
                                {optionsExpanded ? "Collapse" : "Expand"}
                            </Button>
                        </InlineStack>

                        {optionsExpanded && (
                            <BlockStack gap="200">

                                {/* OPTION LABEL HEADING */}

                                <InlineStack
                                    align="center"
                                    blockAlign="center"
                                    gap="200"
                                    wrap={false}
                                >
                                    <Box width="12px" />

                                    <Box flex="1">
                                        <InlineStack
                                            align="center"
                                            blockAlign="center"
                                            gap="100"
                                        >
                                            <Text variant="bodySm">
                                                Option Label
                                            </Text>

                                            <Icon
                                                source={PolarisIcons.InfoIcon}
                                                tone="subdued"
                                            />
                                        </InlineStack>
                                    </Box>

                                    <Box width="20px" />
                                </InlineStack>

                                {/* OPTIONS LIST */}

                                {options.map((option, index) => (
                                    <InlineStack
                                        key={option.id || index}
                                        align="center"
                                        blockAlign="center"
                                        gap="200"
                                    >
                                        <Box width="12px">
                                            <Text tone="subdued">
                                                ⠿
                                            </Text>
                                        </Box>

                                        <Box flex="1">
                                            <TextField
                                                label={`Option ${index + 1}`}
                                                labelHidden
                                                value={option.label || ""}
                                                suffix="en"
                                                onChange={(value) =>
                                                    updateOption(index, value)
                                                }
                                                autoComplete="off"
                                            />
                                        </Box>

                                        <Button
                                            variant="plain"
                                            tone="critical"
                                            icon={PolarisIcons.DeleteIcon}
                                            accessibilityLabel={`Delete option ${index + 1}`}
                                            onClick={() =>
                                                deleteOption(index)
                                            }
                                        />
                                    </InlineStack>
                                ))}

                                {/* ADD BUTTONS */}

                                <InlineStack gap="200">
                                    <Button
                                        size="slim"
                                        onClick={addOption}
                                    >
                                        Add Option
                                    </Button>

                                    <Button
                                        size="slim"
                                        onClick={() =>
                                            setBulkAddOpen(!bulkAddOpen)
                                        }
                                    >
                                        Bulk add Option
                                    </Button>
                                </InlineStack>

                                {/* BULK ADD */}

                                {bulkAddOpen && (
                                    <BlockStack gap="200">
                                        <TextField
                                            label="Add multiple options"
                                            value={bulkOptionsText}
                                            onChange={setBulkOptionsText}
                                            multiline={4}
                                            placeholder={"Option 1\nOption 2\nOption 3"}
                                            autoComplete="off"
                                        />

                                        <InlineStack align="end">
                                            <Button
                                                variant="primary"
                                                disabled={!bulkOptionsText.trim()}
                                                onClick={bulkAddOptions}
                                            >
                                                Add options
                                            </Button>
                                        </InlineStack>
                                    </BlockStack>
                                )}

                            </BlockStack>
                        )}
                    </BlockStack>
                </Box>

                {/* OTHER OPTION */}

                {showOtherOption && (
                    <BlockStack gap="200">
                        <Checkbox
                            label="Other option"
                            checked={Boolean(element.otherOption)}
                            onChange={(value) =>
                                update("otherOption", value)
                            }
                        />

                        {element.otherOption && (
                            <BlockStack gap="200">
                                <TextField
                                    label="Other label"
                                    value={element.otherLabel || ""}
                                    onChange={(value) =>
                                        update("otherLabel", value)
                                    }
                                    autoComplete="off"
                                />

                                <TextField
                                    label="Other placeholder"
                                    value={element.otherPlaceholder || ""}
                                    onChange={(value) =>
                                        update("otherPlaceholder", value)
                                    }
                                    autoComplete="off"
                                />
                            </BlockStack>
                        )}
                    </BlockStack>
                )}

                {/* LIMIT SELECTIONS */}

                {showLimitSelections && (
                    <BlockStack gap="200">
                        <Checkbox
                            label="Limit selections"
                            checked={Boolean(element.limitSelections)}
                            onChange={(value) =>
                                update("limitSelections", value)
                            }
                        />

                        {element.limitSelections && (
                            <InlineStack gap="300" wrap={false}>
                                <Box width="50%">
                                    <TextField
                                        label="Min selections"
                                        type="number"
                                        placeholder="0-2"
                                        value={String(element.minSelections ?? "")}
                                        onChange={(value) =>
                                            update("minSelections", value)
                                        }
                                        autoComplete="off"
                                        max={2}
                                        condensed
                                    />
                                </Box>

                                <Box width="50%">
                                    <TextField
                                        label="Max selections"
                                        type="number"
                                        placeholder="0-2"
                                        value={String(element.maxSelections ?? "")}
                                        onChange={(value) =>
                                            update("maxSelections", value)
                                        }
                                        autoComplete="off"
                                        max={2}
                                        condensed
                                    />
                                </Box>
                            </InlineStack>
                        )}
                    </BlockStack>
                )}

            </BlockStack>
        );
    };

    // COMMON SETTINGS UI
    return (
        <BlockStack gap="300">

            {/* LABEL */}

            {!isParagraph && !isDivider && !isHeading && (
                <TextField
                    label="Label"
                    value={element.label || ""}
                    onChange={(value) => update("label", value)}
                    autoComplete="off"
                />
            )}

            {/* CHOICE OPTIONS */}

            {renderChoiceSettings()}

            {/* PLACEHOLDER */}

            {!isQuantity && (
                isContactInput ||
                isCountry ||
                isDropdown ||
                isDateTime
            ) && (
                    <TextField
                        label="Placeholder"
                        value={element.placeholder || ""}
                        onChange={(value) => update("placeholder", value)}
                        autoComplete="off"
                    />
                )}

            {/* DEFAULT VALUE */}

            {!isQuantity && showDefaultValue && (
                isCountry ? (
                    <Select
                        label="Default value"
                        placeholder="Select default country"
                        options={countries.map((country) => ({
                            label: country.label,
                            value: country.value,
                        }))}
                        value={element.defaultValue || ""}
                        onChange={(value) => update("defaultValue", value)}
                    />
                ) : (
                    <TextField
                        label="Enter default value"
                        value={element.defaultValue || ""}
                        onChange={(value) => update("defaultValue", value)}
                        multiline={isChoiceInput ? 4 : false}
                        autoComplete="off"
                    />
                )
            )}

            {/* DESCRIPTION / CAPTION */}

            {(!isStaticText || isHeading) && (
                <TextField
                    label={isHeading ? "Caption" : "Description"}
                    value={element.description || ""}
                    onChange={(value) => update("description", value)}
                    autoComplete="off"
                />
            )}

            {/* INPUT-SPECIFIC SETTINGS */}

            {!isStaticText && (
                <>
                    {/* CHARACTER LIMIT */}

                    {showCharacterLimit && (
                        <BlockStack gap="200">
                            <Checkbox
                                label="Limit characters"
                                checked={element.limitCharacters || false}
                                onChange={(value) =>
                                    update("limitCharacters", value)
                                }
                            />

                            {element.limitCharacters && (
                                <div className="character-limit-settings">
                                    <div className="character-limit-settings__fields">
                                        <TextField
                                            label="Min characters"
                                            type="number"
                                            value={String(element.minCharacters ?? "")}
                                            onChange={(value) =>
                                                update("minCharacters", value)
                                            }
                                            autoComplete="off"
                                        />

                                        <TextField
                                            label="Max characters"
                                            type="number"
                                            value={String(element.maxCharacters ?? "")}
                                            onChange={(value) =>
                                                update("maxCharacters", value)
                                            }
                                            autoComplete="off"
                                        />
                                    </div>

                                    <Text as="p" tone="subdued">
                                        Note: If you don't want to set a maximum
                                        number of characters, leave this field
                                        blank instead of setting it to 0.
                                    </Text>
                                </div>
                            )}
                        </BlockStack>
                    )}

                    {/* HIDE LABEL */}

                    <Checkbox
                        label="Hide label"
                        checked={element.hideLabel || false}
                        onChange={(value) =>
                            update("hideLabel", value)
                        }
                    />

                    {showKeepLabelPosition && element.hideLabel && (
                        <Checkbox
                            label="Keep position of label"
                            checked={element.keepLabelPosition || false}
                            onChange={(value) =>
                                update("keepLabelPosition", value)
                            }
                        />
                    )}

                    {/* REQUIRED */}

                    <Checkbox
                        label="Required"
                        checked={element.required || false}
                        onChange={(value) =>
                            update("required", value)
                        }
                    />

                    {element.required && (
                        <TextField
                            label="Required error message"
                            value={element.requiredMessage || ""}
                            onChange={(value) =>
                                update("requiredMessage", value)
                            }
                            autoComplete="off"
                            helpText="Shown when this field is required and left empty on submit."
                        />
                    )}

                    {showRequiredNote && element.required && (
                        <Checkbox
                            label="Show required note if hide label?"
                            checked={element.showRequiredNote || false}
                            onChange={(value) =>
                                update("showRequiredNote", value)
                            }
                        />
                    )}

                    {/* SELECT ICON */}

                    {showSelectIcon && (
                        <BlockStack gap="200">

                            <InlineStack
                                align="space-between"
                                blockAlign="center"
                            >
                                <Text as="p" variant="bodyMd">
                                    Select icon
                                </Text>

                                {element.selectIcon && PolarisIcons[element.selectIcon] && (
                                    <ButtonGroup gap="tight">
                                        <Button
                                            variant="plain"
                                            icon={PolarisIcons.RefreshIcon}
                                            onClick={onOpenSelectIcon}
                                        >
                                            Change
                                        </Button>

                                        <Button
                                            variant="plain"
                                            tone="critical"
                                            icon={PolarisIcons.DeleteIcon}
                                            onClick={() =>
                                                update("selectIcon", "")
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </ButtonGroup>
                                )}
                            </InlineStack>

                            {/* SELECTED ICON PREVIEW */}

                            <div className="select-icon-wrapper">
                                {(element.ratingIcon || element.selectIcon) &&
                                    PolarisIcons[element.ratingIcon || element.selectIcon] ? (
                                    <Icon
                                        source={
                                            PolarisIcons[element.ratingIcon || element.selectIcon]
                                        }
                                    />
                                ) : (
                                    <Button onClick={onOpenSelectIcon}>
                                        Select icon
                                    </Button>
                                )}
                            </div>

                        </BlockStack>
                    )}
                </>
            )}

        </BlockStack>
    );
}


/* =========================================
   LAYOUT SETTINGS
   ALWAYS SHOWN AT THE BOTTOM
   EXCEPT HEADER AND FOOTER
========================================= */

function LayoutSettings({ element, onChange, onDelete }) {

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isDivider = type === "divider";

    return (
        <BlockStack gap="400">

            {/* COLUMN WIDTH */}

            {!isDivider && (
                <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                        Column width
                    </Text>

                    <div className="column-width-selector">
                        {["33", "50", "100"].map((width) => {
                            const selected =
                                String(element.columnWidth || "100") === width;

                            return (
                                <button
                                    key={width}
                                    type="button"
                                    className={`column-width-selector__option ${selected ? "is-selected" : ""
                                        }`}
                                    onClick={() => update("columnWidth", width)}
                                >
                                    {width}%
                                </button>
                            );
                        })}
                    </div>
                </BlockStack>
            )}

            {/* CUSTOM CSS CLASS */}

            <TextField
                label="Custom CSS class"
                value={element.customClass || ""}
                onChange={(value) => update("customClass", value)}
                autoComplete="off"
            />

            {/* REMOVE ELEMENT */}

            {/* {onDelete && (
                <>
                    <Divider />

                    <Button
                        variant="plain"
                        tone="critical"
                        icon={PolarisIcons.DeleteIcon}
                        onClick={onDelete}
                        accessibilityLabel="Remove element"
                        className="remove-element-btn"
                    >
                        Remove element
                    </Button>
                </>
            )} */}

        </BlockStack>
    );
}


/* =========================================
   ELEMENT SETTINGS CONTROLLER
========================================= */

export default function ElementSettings({ element, onChange, onClose, onDelete }) {

    const [activeSection, setActiveSection] = useState("main");

    if (!element) return null;

    const groupType = getElementSettingsType(element.type);


    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    // Identify Header and Footer.
    const isHeaderFooter = [
        "form_header",
        "form_footer",
    ].includes(type);

    const showOptionsPerLine =
        groupType === "choice" &&
        [
            "radio",
            "radio_group",
            "radio_button",
            "checkbox_group",
            "checkboxes",
            "dropdown",
            "select"
        ].includes(type);

    console.log("========== ELEMENT SETTINGS ==========");
    console.log("Element:", element);
    console.log("Element type:", element.type);
    console.log("Settings group:", groupType);
    console.log("======================================");
    // console.log("Choice types:", CHOICE_TYPES);

    const settingsGroups = {
        contact: ContactSettings,
        text: TextSettings,
        choice: ChoiceSettings,
        button: ButtonSettings,
        number: NumberSettings,
        date: DateSettings,
        file: FileSettings,
        static: StaticTextSettings,
        rating: RatingStarSettings,
    };

    const GroupComponent = settingsGroups[groupType];

    // SELECT ICON SECTION

    if (activeSection === "selectIcon") {
        return (
            <div className="element-settings">
                <SelectIcon
                    value={element.selectIcon || ""}
                    onChange={(value) =>
                        onChange({
                            ...element,
                            selectIcon: value,
                        })
                    }
                    onBack={() => setActiveSection("main")}
                />
            </div>
        );
    }

    // RATING ICON SECTION

    if (activeSection === "ratingIcon") {
        return (
            <div className="element-settings">
                <SelectIcon
                    value={element.ratingIcon || ""}
                    onChange={(value) =>
                        onChange({
                            ...element,
                            ratingIcon: value,
                        })
                    }
                    onBack={() => setActiveSection("main")}
                />
            </div>
        );
    }


    return (
        <div className="element-settings">

            {/* FIXED HEADER */}

            <div className="element-settings__header">
                <Box paddingBlock="300">
                    <InlineStack
                        align="start"
                        blockAlign="center"
                        gap="200"
                    >
                        <Button
                            icon={PolarisIcons.ArrowLeftIcon}
                            variant="plain"
                            onClick={onClose}
                            accessibilityLabel="Back to elements"
                        />

                        <Text variant="headingMd" as="h2">
                            {isHeaderFooter
                                ? type === "form_header"
                                    ? "Header settings"
                                    : "Footer settings"
                                : element.label || element.type}
                        </Text>
                    </InlineStack>
                </Box>

                <Divider />
            </div>

            {/* SCROLLABLE CONTENT */}

            <div className="element-settings__content">
                <BlockStack gap="400">

                    <CommonSettings
                        element={element}
                        onChange={onChange}
                        onOpenSelectIcon={() =>
                            setActiveSection("selectIcon")
                        }
                    />

                    {!isHeaderFooter && GroupComponent && (
                        <GroupComponent
                            element={element}
                            onChange={onChange}
                            onOpenRatingIcon={() =>
                                setActiveSection("ratingIcon")
                            }
                        />
                    )}

                    {!isHeaderFooter && showOptionsPerLine && (
                        <BlockStack gap="200">
                            <Text variant="bodyMd">
                                Number of options per line
                            </Text>

                            <div className="column-width-selector">
                                {[5, 4, 3, 2, 1].map((number) => (
                                    <div
                                        key={number}
                                        className={`chooseItem ${Number(element.optionsPerLine || 1) === number
                                                ? "active"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            onChange({
                                                ...element,
                                                optionsPerLine: number,
                                            })
                                        }
                                    >
                                        {number}
                                    </div>
                                ))}
                            </div>
                        </BlockStack>
                    )}

                    {!isHeaderFooter && (
                        <LayoutSettings
                            element={element}
                            onChange={onChange}
                        />
                    )}

                </BlockStack>
            </div>

            {/* FIXED BOTTOM REMOVE BUTTON */}

            {!isHeaderFooter && (
                <div className="element-settings__footer">
                    <Button
                        variant="plain"
                        tone="critical"
                        icon={PolarisIcons.DeleteIcon}
                        onClick={onDelete}
                        className="remove-element-btn"
                        accessibilityLabel="Remove element"
                    >
                        Remove element
                    </Button>
                </div>
            )}

        </div>
    );
}
