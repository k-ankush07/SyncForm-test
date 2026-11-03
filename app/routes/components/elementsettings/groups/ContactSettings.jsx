
import React from "react";

import {
    BlockStack,
    TextField,
    Checkbox,
    Select,
} from "@shopify/polaris";
import { countryOptions } from "../utils/countries.js";

export default function ContactSettings({ element, onChange }) {

    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    const type = String(element.type || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isName = ["name", "first_name", "last_name"].includes(type);

    return (
        <BlockStack gap="300">

            {/* =================================
                EMAIL SETTINGS
            ================================= */}

            {type === "email" && (
                <BlockStack gap="300">

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

            {isName && (
                <BlockStack gap="300">

                    {/* NAME FORMAT - COMBINED NAME ONLY */}

                    {type === "name" && (
                        <>
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
                        </>
                    )}

                    {/* ENTER NUMBERS ONLY */}

                    <Checkbox
                        label="Enter numbers only"
                        checked={element.numbersOnly || false}
                        onChange={(value) =>
                            update("numbersOnly", value)
                        }
                    />

                    {/* NAME VALIDATION */}

                    <Checkbox
                        label="Name validation"
                        checked={element.nameValidation !== false}
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
                        value={element.defaultCountryCode || "auto"}
                        options={countryOptions}
                        onChange={(value) =>
                            update("defaultCountryCode", value)
                        }
                    />

                </BlockStack>
            )}



            {/* =================================
                     PASSWORD SETTINGS
                ================================= */}

            {type === "password" && (
                <BlockStack gap="300">

                    <Select
                        label="Validate"
                        value={element.passwordValidation || "none"}
                        options={[
                            { label: "None", value: "false" },

                            {
                                label: "Minimum 6 characters",
                                value: "^.{6,}$",
                            },

                            {
                                label: "Minimum 6 characters, at least one letter and one number",
                                value: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$",
                            },

                            {
                                label: "Minimum 6 characters, at least one letter, one number and one special character",
                                value: "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{6,}$",
                            },

                            {
                                label: "Minimum 6 characters, at least one uppercase letter, one lowercase letter and one number",
                                value: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$",
                            },

                            {
                                label: "Minimum 6 characters, at least one uppercase letter, one lowercase letter, one number and one special character",
                                value: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$",
                            },

                            {
                                label: "Advanced validate rule",
                                value: "advancedValidateRule",
                            },
                        ]}
                        onChange={(value) =>
                            update("passwordValidation", value)
                        }
                    />

                    <Checkbox
                        label="Also create confirm password input"
                        checked={Boolean(element.confirmPassword)}
                        onChange={(value) =>
                            update("confirmPassword", value)
                        }
                    />

                    {element.confirmPassword && (
                        <BlockStack gap="200">

                            <TextField
                                label="Label confirm"
                                value={element.confirmPasswordLabel ?? "Confirm Password"}
                                onChange={(value) =>
                                    update("confirmPasswordLabel", value)
                                }
                                autoComplete="off"
                            />

                            <TextField
                                label="Placeholder confirm"
                                value={element.confirmPasswordPlaceholder ?? "Confirm your password"}
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
                        label="Store password for purpose"
                        checked={Boolean(element.storePassword)}
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
