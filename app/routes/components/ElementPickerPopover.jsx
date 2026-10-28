import React from "react";
import {
    ActionList,
    Box,
    Icon,
    InlineGrid,
    Text,
} from "@shopify/polaris";

import { ELEMENT_TYPES } from "./elementsConfig.js";
// import "./ElementPickerPopover.css";

const ELEMENT_CATEGORIES = [
    "Contact info",
    "Selects",
    "Input",
    "Static text",
    "Text",
    "Ratings",
    "File upload",
    "Color",
    "Number",
];

export default function ElementPickerPopover({
    open,
    position,
    onClose,
    onSelect,
}) {
    if (!open) return null;

    return (
        <div
            className="element-picker-backdrop"
            onMouseDown={onClose}
        >
            <div
                className="element-picker-popover"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
                role="dialog"
                aria-label="Add element"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="element-picker-popover__content">
                    <InlineGrid columns={4} gap="400">
                        {ELEMENT_CATEGORIES.map((category) => {
                            const items = ELEMENT_TYPES.filter(
                                (item) => item.category === category
                            );

                            if (items.length === 0) return null;

                            return (
                                <Box key={category}>
                                    <Box paddingBlockEnd="200">
                                        <Text
                                            as="h3"
                                            variant="headingSm"
                                        >
                                            {category}
                                        </Text>
                                    </Box>

                                    <div className="element-picker-items">
                                        {items.map((item) => (
                                            <button
                                                key={item.type}
                                                type="button"
                                                className="element-picker-item"
                                                onClick={() => onSelect(item)}
                                            >
                                                {item.icon && (
                                                    <span className="element-picker-item__icon">
                                                        <Icon source={item.icon} />
                                                    </span>
                                                )}

                                                <span className="element-picker-item__label">
                                                    {item.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </Box>
                            );
                        })}
                    </InlineGrid>
                </div>
            </div>
        </div>
    );
}