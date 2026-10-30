
import React from "react";

import {
    BlockStack,
    TextField,
    Checkbox,
    Select,
    Divider,
    Text,
} from "@shopify/polaris";

export default function ContactSettings({ element, onChange }) {

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    const type = element.type;

    return (
        <BlockStack gap="300">

            {/* <Text variant="headingMd" as="h3">
                Input settings
            </Text> */}

            {/* =================================
                COMMON CONTACT SETTINGS
                Read only remains contact-specific
            ================================= */}

            <Checkbox
                label="Read only"
                checked={element.readOnly || false}
                onChange={(value) => update("readOnly", value)}
            />

            <Divider />

            {/* =================================
                EMAIL SETTINGS
            ================================= */}

            {type === "email" && (
                <BlockStack gap="300">

                    {/* <Text variant="headingMd" as="h3">
                        Email settings
                    </Text> */}

                    <Checkbox
                        label="Enable email validation"
                        checked={element.emailValidation !== false}
                        onChange={(value) =>
                            update("emailValidation", value)
                        }
                    />

                    <Checkbox
                        label="Also create confirm email input"
                        checked={element.confirmEmail || false}
                        onChange={(value) =>
                            update("confirmEmail", value)
                        }
                    />

                    {element.confirmEmail && (
                        <BlockStack gap="200">

                            <TextField
                                label="Label confirm"
                                value={element.confirmEmailLabel || ""}
                                onChange={(value) =>
                                    update("confirmEmailLabel", value)
                                }
                                autoComplete="off"
                            />

                            <TextField
                                label="Placeholder confirm"
                                value={element.confirmEmailPlaceholder || ""}
                                onChange={(value) =>
                                    update("confirmEmailPlaceholder", value)
                                }
                                autoComplete="off"
                            />

                            <TextField
                                label="Description confirm"
                                value={element.confirmEmailDescription || ""}
                                onChange={(value) =>
                                    update("confirmEmailDescription", value)
                                }
                                autoComplete="off"
                            />

                        </BlockStack>
                    )}

                </BlockStack>
            )}

            {/* =================================
                NAME SETTINGS
            ================================= */}

            {type === "name" && (
                <BlockStack gap="300">

                    {/* <Text variant="headingMd" as="h3">
                        Name settings
                    </Text> */}

                    <Select
                        label="Name format"
                        value={element.nameFormat || "full"}
                        options={[
                            { label: "Full name", value: "full" },
                            { label: "First and last name", value: "split" },
                        ]}
                        onChange={(value) =>
                            update("nameFormat", value)
                        }
                    />

                    {element.nameFormat === "split" && (
                        <Checkbox
                            label="Require last name"
                            checked={element.requireLastName || false}
                            onChange={(value) =>
                                update("requireLastName", value)
                            }
                        />
                    )}

                    <Checkbox
                        label="Enter numbers only"
                        checked={element.numbersOnly || false}
                        onChange={(value) =>
                            update("numbersOnly", value)
                        }
                    />

                    <Select
                        label="Name validation"
                        value={element.nameValidation || "none"}
                        options={[
                            { label: "None", value: "none" },
                            { label: "Letters only", value: "letters" },
                            { label: "Letters and spaces", value: "letters_spaces" },
                        ]}
                        onChange={(value) =>
                            update("nameValidation", value)
                        }
                    />

                </BlockStack>
            )}

            {/* =================================
                PHONE SETTINGS
            ================================= */}

            {type === "phone" && (
                <BlockStack gap="300">
{/* 
                    <Text variant="headingMd" as="h3">
                        Phone settings
                    </Text> */}

                    <Checkbox
                        label="Validate international telephone numbers"
                        checked={element.phoneValidation !== false}
                        onChange={(value) =>
                            update("phoneValidation", value)
                        }
                    />

                    <Checkbox
                        label="Show country code"
                        checked={element.showCountryCode !== false}
                        onChange={(value) =>
                            update("showCountryCode", value)
                        }
                    />

                    <Select
                        label="Select default country"
                        value={element.defaultCountry || ""}
                        options={[
                            { label: "Select country", value: "" },
                            { label: "India", value: "IN" },
                            { label: "United States", value: "US" },
                            { label: "United Kingdom", value: "GB" },
                            { label: "Canada", value: "CA" },
                            { label: "Australia", value: "AU" },
                        ]}
                        onChange={(value) =>
                            update("defaultCountry", value)
                        }
                    />

                </BlockStack>
            )}

            {/* =================================
                PASSWORD SETTINGS
            ================================= */}

            {type === "password" && (
                <BlockStack gap="300">

                    {/* <Text variant="headingMd" as="h3">
                        Password settings
                    </Text> */}

                    <Select
                        label="Validate"
                        value={element.passwordValidation || "none"}
                        options={[
                            { label: "No additional validation", value: "none" },
                            { label: "Letters and numbers", value: "letters_numbers" },
                            { label: "Uppercase and lowercase", value: "upper_lower" },
                            { label: "Special characters", value: "special" },
                        ]}
                        onChange={(value) =>
                            update("passwordValidation", value)
                        }
                    />

                    <Checkbox
                        label="Also create confirm password input"
                        checked={element.confirmPassword || false}
                        onChange={(value) =>
                            update("confirmPassword", value)
                        }
                    />

                    {element.confirmPassword && (
                        <BlockStack gap="200">

                            <TextField
                                label="Label confirm"
                                value={element.confirmPasswordLabel || ""}
                                onChange={(value) =>
                                    update("confirmPasswordLabel", value)
                                }
                                autoComplete="off"
                            />

                            <TextField
                                label="Placeholder confirm"
                                value={element.confirmPasswordPlaceholder || ""}
                                onChange={(value) =>
                                    update("confirmPasswordPlaceholder", value)
                                }
                                autoComplete="off"
                            />

                            <TextField
                                label="Description confirm"
                                value={element.confirmPasswordDescription || ""}
                                onChange={(value) =>
                                    update("confirmPasswordDescription", value)
                                }
                                autoComplete="off"
                            />

                        </BlockStack>
                    )}

                    <Checkbox
                        label="Store password data"
                        checked={element.storePassword || false}
                        onChange={(value) =>
                            update("storePassword", value)
                        }
                    />

                </BlockStack>
            )}

            {/* =================================
                COUNTRY SETTINGS
            ================================= */}

            {type === "country" && (
                <BlockStack gap="300">

                    {/* <Text variant="headingMd" as="h3">
                        Country settings
                    </Text> */}

                    <Checkbox
                        label="Show country flags"
                        checked={element.showFlags || false}
                        onChange={(value) =>
                            update("showFlags", value)
                        }
                    />

                    <Checkbox
                        label="Allow multiple countries"
                        checked={element.allowMultiple || false}
                        onChange={(value) =>
                            update("allowMultiple", value)
                        }
                    />

                </BlockStack>
            )}

        </BlockStack>
    );
}
