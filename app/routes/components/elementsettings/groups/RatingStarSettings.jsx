import React from "react";

import {
    BlockStack,
    Checkbox,
    Button,
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
                    {element.ratingIcon
                        ? "Change icon"
                        : "Select icon"}
                </Button>
            )}

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