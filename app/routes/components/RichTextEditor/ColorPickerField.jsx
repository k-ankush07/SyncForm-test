
import React, { useState, useCallback, useEffect } from "react";

import {
    Box,
    Button,
    ColorPicker,
    InlineStack,
    Popover,
    Text,
    TextField,
} from "@shopify/polaris";

import { DeleteIcon } from "@shopify/polaris-icons";

// HEX to HSB
function hexToHsb(hex) {
    const value = hex.replace("#", "");

    const r = parseInt(value.substring(0, 2), 16) / 255;
    const g = parseInt(value.substring(2, 4), 16) / 255;
    const b = parseInt(value.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;

    if (delta !== 0) {
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;

        hue *= 60;
        if (hue < 0) hue += 360;
    }

    return {
        hue,
        saturation: max === 0 ? 0 : delta / max,
        brightness: max,
    };
}

// HSB to HEX
function hsbToHex({ hue, saturation, brightness }) {
    const chroma = brightness * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = brightness - chroma;

    let rgb;

    if (hue < 60) rgb = [chroma, x, 0];
    else if (hue < 120) rgb = [x, chroma, 0];
    else if (hue < 180) rgb = [0, chroma, x];
    else if (hue < 240) rgb = [0, x, chroma];
    else if (hue < 300) rgb = [x, 0, chroma];
    else rgb = [chroma, 0, x];

    return (
        "#" +
        rgb.map((value) =>
            Math.round((value + m) * 255)
                .toString(16)
                .padStart(2, "0")
        ).join("")
    ).toUpperCase();
}

export default function ColorPickerField({
    label = "Color",
    value = "",
    onChange,
    helpText,
}) {
    const [open, setOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value);

    // Keep input synchronized with parent value
    useEffect(() => {
        setHexInput(value || "");
    }, [value]);

    // Open / close popover
    const togglePopover = useCallback(() => {
        setOpen((previous) => !previous);
    }, []);

    const closePopover = useCallback(() => {
        setOpen(false);
    }, []);

    // Handle color picker selection
    const handleColorChange = (color) => {
        const hex = hsbToHex(color);

        setHexInput(hex);
        onChange(hex);
    };

    // Handle manual HEX input
    const handleHexChange = (input) => {
        setHexInput(input);

        let hex = input.trim();

        if (!hex.startsWith("#")) {
            hex = `#${hex}`;
        }

        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
            onChange(hex.toUpperCase());
        } else if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
            const expanded =
                "#" +
                hex.slice(1)
                    .split("")
                    .map((char) => char + char)
                    .join("");

            onChange(expanded.toUpperCase());
        }
    };

    // Reset color
    const resetColor = () => {
        setHexInput("");
        onChange("");
    };

    // Current picker color
    const pickerColor =
        value && /^#[0-9a-fA-F]{6}$/.test(value)
            ? hexToHsb(value)
            : { hue: 0, saturation: 0, brightness: 0 };

    // Clickable activator
    const activator = (
        <button
            type="button"
            onClick={togglePopover}
            aria-expanded={open}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "4px 0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
            }}
        >
            <span
                style={{
                    width: "40px",
                    height: "40px",
                    minWidth: "40px",
                    borderRadius: "50%",
                    backgroundColor: value || "currentColor",
                    border: "1px solid rgba(0,0,0,0.12)",
                }}
            />

            <span>
                <span style={{ display: "block" }}>
                    <Text variant="bodyMd">{label}</Text>
                </span>

                <span style={{ display: "block" }}>
                    <Text variant="bodySm" tone="subdued">
                        {value || "Default"}
                    </Text>
                </span>
            </span>
        </button>
    );

    return (
        <Box>
            <Popover
                active={open}
                activator={activator}
                onClose={closePopover}
                zIndexOverride={100000}
            >
                <Box padding="300" width="270px">
                    <ColorPicker
                        color={pickerColor}
                        onChange={handleColorChange}
                        allowAlpha={false}
                    />

                    <Box paddingBlockStart="300">
                        <InlineStack align="center" gap="200">
                            <Box width="100%">
                                <TextField
                                    label="HEX color"
                                    labelHidden
                                    value={hexInput}
                                    onChange={handleHexChange}
                                    autoComplete="off"
                                    placeholder="#000000"
                                />
                            </Box>

                            <Button
                                icon={DeleteIcon}
                                variant="secondary"
                                accessibilityLabel="Reset color"
                                onClick={resetColor}
                            />
                        </InlineStack>
                    </Box>
                </Box>
            </Popover>

            {helpText && (
                <Box paddingBlockStart="200">
                    <Text variant="bodySm" tone="subdued">
                        {helpText}
                    </Text>
                </Box>
            )}
        </Box>
    );
}
