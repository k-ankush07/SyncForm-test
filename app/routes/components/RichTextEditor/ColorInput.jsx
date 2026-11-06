import React, { useState, useCallback, useEffect, useId } from "react";
import {
    ColorPicker,
    TextField,
    Popover,
} from "@shopify/polaris";

function hexToRgb(hex) {
    const safeHex = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#563D7C";

    return {
        r: parseInt(safeHex.slice(1, 3), 16),
        g: parseInt(safeHex.slice(3, 5), 16),
        b: parseInt(safeHex.slice(5, 7), 16),
    };
}

function rgbToHsb({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;

    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }

    return {
        hue: h,
        saturation: max === 0 ? 0 : delta / max,
        brightness: max,
    };
}

function hsbToHex({ hue, saturation, brightness }) {
    const c = brightness * saturation;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = brightness - c;

    let r = 0, g = 0, b = 0;

    if (hue < 60) [r, g, b] = [c, x, 0];
    else if (hue < 120) [r, g, b] = [x, c, 0];
    else if (hue < 180) [r, g, b] = [0, c, x];
    else if (hue < 240) [r, g, b] = [0, x, c];
    else if (hue < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    const toHex = (v) =>
        Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorInput({ label, value, onChange }) {
    const [active, setActive] = useState(false);
    const instanceId = useId();

    useEffect(() => {
        console.log(`Popover ${instanceId} ACTIVE:`, active);
    }, [active]);

    useEffect(() => {
  console.log("COLOR INPUT MOUNTED:", instanceId);

  return () => {
    console.log("COLOR INPUT UNMOUNTED:", instanceId);
  };
}, [instanceId]);
    const togglePopover = useCallback((event) => {
        event.stopPropagation();

        console.log(`CLICKED POPOVER: ${instanceId}`);

        setActive(true);
    }, [instanceId]);

  const closePopover = useCallback(() => {
  console.log("POPOVER CLOSED");
  console.trace("WHO TRIGGERED POPOVER CLOSE");

  setActive(false);
}, []);

    const hsb = rgbToHsb(hexToRgb(value));

  const activator = (
  <div
    className="color-input-activator"
    onClick={togglePopover}
    style={{
      width: "100%",
      cursor: "pointer",
    }}
  >
    <TextField
      label={label}
      value={value || "#563D7C"}
      autoComplete="off"
      readOnly
      suffix={
        <div
          className="color-suffix-box"
          style={{
            backgroundColor: value || "#563D7C",
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            border: "1px solid #8c9196",
          }}
        />
      }
    />
  </div>
);
    return (
        <Popover
            active={active}
            activator={activator}
            onClose={closePopover}
            autofocusTarget="none"
            preferredAlignment="right"
            preferredPosition="below"
            preferInputActivator={false}
        >
            <div
                style={{
                    padding: "16px",
                }}
                //onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                <ColorPicker
                    color={hsb}
                    onChange={(newColor) => {
                        const hex = hsbToHex(newColor);
                        console.log("SELECTED COLOR:", hex);
                        onChange(hex);
                    }}
                />
            </div>
        </Popover>
    );

}