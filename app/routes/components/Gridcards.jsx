import React from "react";
import {
  Text,
  Card,
  BlockStack,
  Icon,
  Box,
} from "@shopify/polaris";

function Gridcards({ title, value, icon }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Card>
        <BlockStack gap="200">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ flex: 1 }}>
              <Text as="p" variant="bodySm">
                {title}
              </Text>
            </div>

            <Icon source={icon} />
          </div>

          <Text as="h2" variant="headingLg">
            {value}
          </Text>

          <Text as="p" variant="bodySm" tone="subdued">
            vs previous 7 days
          </Text>
        </BlockStack>
      </Card>
    </div>
  );
}

export default Gridcards;