
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
            ================================= */}

            <TextField
                label="Placeholder"
                value={element.placeholder || ""}
                onChange={(value) => update("placeholder", value)}
                autoComplete="off"
            />

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
                        label="Confirm email"
                        checked={element.confirmEmail || false}
                        onChange={(value) =>
                            update("confirmEmail", value)
                        }
                    />

                    {element.confirmEmail && (
                        <TextField
                            label="Confirmation field label"
                            value={element.confirmEmailLabel || ""}
                            onChange={(value) =>
                                update("confirmEmailLabel", value)
                            }
                            autoComplete="off"
                        />
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
                        label="Show country code"
                        checked={element.showCountryCode !== false}
                        onChange={(value) =>
                            update("showCountryCode", value)
                        }
                    />

                    <Checkbox
                        label="Enable phone validation"
                        checked={element.phoneValidation !== false}
                        onChange={(value) =>
                            update("phoneValidation", value)
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

                    <TextField
                        label="Minimum length"
                        type="number"
                        value={String(element.minLength ?? 8)}
                        onChange={(value) =>
                            update("minLength", value)
                        }
                        autoComplete="off"
                    />

                    <TextField
                        label="Maximum length"
                        type="number"
                        value={String(element.maxLength ?? 50)}
                        onChange={(value) =>
                            update("maxLength", value)
                        }
                        autoComplete="off"
                    />

                    <Checkbox
                        label="Require uppercase letter"
                        checked={element.requireUppercase || false}
                        onChange={(value) =>
                            update("requireUppercase", value)
                        }
                    />

                    <Checkbox
                        label="Require number"
                        checked={element.requireNumber || false}
                        onChange={(value) =>
                            update("requireNumber", value)
                        }
                    />

                    <Checkbox
                        label="Require special character"
                        checked={element.requireSpecialCharacter || false}
                        onChange={(value) =>
                            update("requireSpecialCharacter", value)
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
