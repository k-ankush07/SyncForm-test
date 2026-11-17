
import React from "react";

import {
  BlockStack,
  Checkbox,
  Button,
  Text,
  InlineStack,
} from "@shopify/polaris";

export default function RatingStarSettings({
  element,
  onChange,
  onOpenRatingIcon,
}) {
  const update = (key, value) => {
    onChange({
      ...element,
      [key]: value,
    });
  };

  const ratingColor = element.ratingColor || "#2E4E49";

  return (
    <BlockStack gap="300">
      {/* CHOOSE ANOTHER ICON */}
      <Checkbox
        label="Choose another icon"
        checked={Boolean(element.useCustomRatingIcon)}
        onChange={(value) =>
          update("useCustomRatingIcon", value)
        }
      />

      {element.useCustomRatingIcon && (
        <Button
          fullWidth
          onClick={onOpenRatingIcon}
        >
          {element.ratingIcon ? "Change icon" : "Select icon"}
        </Button>
      )}

      {/* RATING COLOR */}
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" fontWeight="medium">
          Rating color
        </Text>

        <InlineStack gap="200" blockAlign="center">
          <input
            type="color"
            value={ratingColor}
            onChange={(event) =>
              update("ratingColor", event.target.value)
            }
            aria-label="Choose rating color"
            style={{
              width: "42px",
              height: "38px",
              padding: "2px",
              border: "1px solid #C9CCCF",
              borderRadius: "6px",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          />

          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={ratingColor}
              onChange={(event) =>
                update("ratingColor", event.target.value)
              }
              aria-label="Rating color hex value"
              maxLength={7}
              style={{
                width: "100%",
                height: "36px",
                padding: "0 10px",
                border: "1px solid #8C9196",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <Button
            size="slim"
            onClick={() => update("ratingColor", "#2E4E49")}
          >
            Reset
          </Button>
        </InlineStack>
      </BlockStack>

      {/* SHOW NUMBER UNDER ICON */}
      <Checkbox
        label="Show number under icon"
        checked={Boolean(element.showNumberUnderIcon)}
        onChange={(value) =>
          update("showNumberUnderIcon", value)
        }
      />
    </BlockStack>
  );
}