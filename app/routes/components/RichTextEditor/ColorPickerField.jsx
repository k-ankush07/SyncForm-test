
import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";

import { createPortal } from "react-dom";

import {
    Box,
    ColorPicker,
    Text,
    TextField,
} from "@shopify/polaris";

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

    const x =
        chroma * (1 - Math.abs(((hue / 60) % 2) - 1));

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

// Normalize HEX
function normalizeHex(hex) {
    let color = hex.trim();

    if (!color.startsWith("#")) {
        color = `#${color}`;
    }

    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
        color =
            "#" +
            color
                .slice(1)
                .split("")
                .map((char) => char + char)
                .join("");
    }

    return /^#[0-9a-fA-F]{6}$/.test(color)
        ? color.toUpperCase()
        : null;
}

export default function ColorPickerField({
    label = "Color",
    value = "",
    onChange,
    helpText,
}) {
    const [open, setOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value || "");

    const [position, setPosition] = useState(null);

    const activatorRef = useRef(null);
    const popoverRef = useRef(null);

    // Sync input with parent
    useEffect(() => {
        setHexInput(value || "");
    }, [value]);

    // Calculate custom popover position
    const updatePosition = useCallback(() => {
        if (!activatorRef.current || !popoverRef.current) {
            return;
        }

        const rect =
            activatorRef.current.getBoundingClientRect();

        const popoverRect =
            popoverRef.current.getBoundingClientRect();

        const popoverWidth = popoverRect.width;
        const popoverHeight = popoverRect.height;

        const gap = 8;
        const padding = 8;

        // Align popover with activator's left edge
        let left = rect.left;

        // Prevent overflow on right
        left = Math.min(
            left,
            window.innerWidth - popoverWidth - padding
        );

        // Prevent overflow on left
        left = Math.max(padding, left);

        // Prefer opening below
        const spaceBelow =
            window.innerHeight - rect.bottom;

        const spaceAbove = rect.top;

        let top;

        if (
            spaceBelow >= popoverHeight + gap ||
            spaceBelow >= spaceAbove
        ) {
            top = rect.bottom + gap;

            // Keep inside viewport
            top = Math.min(
                top,
                window.innerHeight - popoverHeight - padding
            );
        } else {
            top = rect.top - popoverHeight - gap;
        }

        setPosition({
            top: Math.max(padding, top),
            left,
        });
    }, []);

    // Update position when opened
    useEffect(() => {
        if (!open) return;

        const update = () => {
            updatePosition();
        };

        update();

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open, updatePosition]);

    // Close when clicking outside
    useEffect(() => {
        if (!open) return;

        const handleOutsideClick = (event) => {
            if (
                activatorRef.current?.contains(event.target) ||
                popoverRef.current?.contains(event.target)
            ) {
                return;
            }

            setOpen(false);
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener(
            "pointerdown",
            handleOutsideClick
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "pointerdown",
                handleOutsideClick
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [open]);

    // Toggle popover
    const togglePopover = () => {
        if (open) {
            setOpen(false);
        } else {
            setPosition(null);
            setOpen(true);
        }
    };

    // Handle color picker selection
    const handleColorChange = (color) => {
        const hex = hsbToHex(color);

        setHexInput(hex);

        onChange(hex);
    };

    // Handle HEX input
    const handleHexChange = (input) => {
        setHexInput(input);

        const hex = normalizeHex(input);

        if (hex) {
            onChange(hex);
        }
    };

    // Current picker color
    const normalizedValue = normalizeHex(value || "");

    const pickerColor = normalizedValue
        ? hexToHsb(normalizedValue)
        : {
            hue: 0,
            saturation: 0,
            brightness: 0,
        };

    // Activator
    const activator = (
        <button
            ref={activatorRef}
            type="button"
            onClick={togglePopover}
            aria-expanded={open}
            aria-haspopup="dialog"
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
                    backgroundColor: normalizedValue || "currentColor",
                    border: "1px solid rgba(0,0,0,0.12)",
                }}
            />

            <span>
                <span style={{ display: "block" }}>
                    <Text variant="bodyMd">
                        {label}
                    </Text>
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
            {activator}

            {/* CUSTOM POPOVER */}
            {open &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={popoverRef}
                        role="dialog"
                        aria-label={`${label} color picker`}
                        className="custom-color-popover"
                        style={{
                            position: "fixed",
                            top: position?.top ?? 0,
                            left: position?.left ?? 0,
                            width: "290px",
                            padding: "12px",
                            background: "#ffffff",
                            border: "1px solid #e3e3e3",
                            borderRadius: "12px",
                            boxShadow:
                                "0 4px 16px rgba(0,0,0,0.16)",
                            zIndex: 100000,
                            visibility: position ? "visible" : "hidden",
                        }}
                    >
                        {/* COLOR PICKER */}
                        <ColorPicker
                            color={pickerColor}
                            onChange={handleColorChange}
                            allowAlpha={false}
                        />

                        {/* HEX INPUT */}
                        <div
                            style={{
                                paddingTop: "12px",
                                width: "100%",
                            }}
                        >
                            <TextField
                                label="HEX color"
                                labelHidden
                                value={hexInput}
                                onChange={handleHexChange}
                                autoComplete="off"
                                placeholder="#000000"
                            />
                        </div>
                    </div>,
                    document.body
                )}

            {/* HELP TEXT */}
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
