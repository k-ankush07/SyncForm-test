import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { ColorPicker, TextField } from "@shopify/polaris";

const DEFAULT_COLOR = "#563D7C";
const PANEL_WIDTH = 248;
const PANEL_HEIGHT = 290;

function hexToRgb(hex) {
  const safeHex = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : DEFAULT_COLOR;
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
  else [r, g, b] = [c, 0, x];

  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export default function ColorInput({ label, value, onChange }) {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const activatorRef = useRef(null);
  const panelRef = useRef(null);

  const safeValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : DEFAULT_COLOR;

  // Keep HSB locally so the hue/saturation don't jump around while dragging
  // (hex -> hsb loses the hue when brightness or saturation is 0).
  const [hsb, setHsb] = useState(() => rgbToHsb(hexToRgb(safeValue)));

  useEffect(() => {
    if (hsbToHex(hsb).toLowerCase() !== safeValue.toLowerCase()) {
      setHsb(rgbToHsb(hexToRgb(safeValue)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue]);

  // Position the panel next to the activator (fixed, so no parent
  // overflow / transform / z-index can clip or break it).
  const updatePosition = useCallback(() => {
    const el = activatorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - PANEL_WIDTH; // right aligned
    left = Math.max(8, Math.min(left, vw - PANEL_WIDTH - 8));

    let top = rect.bottom + 6;
    if (top + PANEL_HEIGHT > vh - 8 && rect.top - PANEL_HEIGHT - 6 > 8) {
      top = rect.top - PANEL_HEIGHT - 6; // flip above
    }

    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!active) return undefined;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [active, updatePosition]);

  // Close on outside pointerdown (capture phase, so it still runs even if
  // other handlers call stopPropagation) and on Escape.
  useEffect(() => {
    if (!active) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (panelRef.current?.contains(target)) return;
      if (activatorRef.current?.contains(target)) return;
      setActive(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActive(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  const toggle = useCallback((event) => {
    // Don't let the click reach the draggable wrapper / selection logic.
    event.stopPropagation();
    setActive((previous) => !previous);
  }, []);

  const stop = (event) => event.stopPropagation();

  return (
    <>
      <div
        ref={activatorRef}
        className="color-input-activator"
        // Prevent dnd-kit from starting a drag from this field.
       // onPointerDown={stop}
        //onMouseDown={stop}
        onClick={toggle}
        style={{ width: "100%", cursor: "pointer" }}
      >
        <TextField
          label={label}
          value={safeValue}
          autoComplete="off"
          readOnly
          suffix={
            <div
              className="color-suffix-box"
              style={{
                backgroundColor: safeValue,
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                border: "1px solid #8c9196",
              }}
            />
          }
        />
      </div>

      {active &&
        createPortal(
          <div
            ref={panelRef}
            className="color-picker-portal"
            // React events from a portal bubble through the React tree
            // (into the draggable/selectable element), so stop them here.
            onPointerDown={stop}
            onMouseDown={stop}
            onTouchStart={stop}
            onClick={stop}
            onKeyDown={stop}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: PANEL_WIDTH,
              zIndex: 100000,
              padding: "16px",
              boxSizing: "border-box",
              background: "var(--p-color-bg-surface, #fff)",
              border: "1px solid #dfe3e8",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            <ColorPicker
              color={hsb}
              onChange={(newColor) => {
                setHsb(newColor);
                onChange(hsbToHex(newColor));
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}