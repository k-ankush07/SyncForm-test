
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@shopify/polaris-icons";
import { Icon, Text, Badge } from "@shopify/polaris";
import { ELEMENT_TYPES } from "./elementsConfig.js";

const CATEGORY_COLUMNS = [
    ["Contact info", "Text", "Color"],
    ["Selects", "Number"],
    ["Input", "Ratings"],
    ["Static text", "File upload"],
];

export default function ElementPickerPopover({
    open,
    position = { top: 0, left: 0 },
    onClose,
    onSelect,
}) {
    const popoverRef = useRef(null);

    const [search, setSearch] = useState("");

    const [popoverPosition, setPopoverPosition] = useState({
        top: 20,
        left: 20,
    });

    // Filter elements according to the search input.
    const filteredElements = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return ELEMENT_TYPES;

        return ELEMENT_TYPES.filter(
            (item) =>
                item.label.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query)
        );
    }, [search]);

    // Build the four columns using filtered elements.
    const columns = useMemo(
        () =>
            CATEGORY_COLUMNS.map((categories) =>
                categories
                    .map((category) => ({
                        category,
                        items: filteredElements.filter(
                            (item) => item.category === category
                        ),
                    }))
                    .filter((group) => group.items.length > 0)
            ),
        [filteredElements]
    );

    // Position the popover within the viewport.
    useEffect(() => {
        if (!open) return;

        const updatePosition = () => {
            const rect = popoverRef.current?.getBoundingClientRect();
            const width = Math.min(800, window.innerWidth - 16);
            const height = rect?.height || 490;

            setPopoverPosition({
                left: Math.max(
                    8,
                    Math.min(
                        Number(position?.left) || 8,
                        window.innerWidth - width - 8
                    )
                ),
                top: Math.max(
                    8,
                    Math.min(
                        Number(position?.top) || 8,
                        window.innerHeight - height - 8
                    )
                ),
            });
        };

        updatePosition();

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open, position]);

    // Close with Escape.
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose?.();
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    // Reset the search whenever the popover closes.
    useEffect(() => {
        if (!open) setSearch("");
    }, [open]);

    if (!open) return null;

    const handleSelect = (item) => {
        if (item.disabled) return;

        onSelect?.(item);
        onClose?.();
    };

    return (
        <div
            className="element-picker-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose?.();
                }
            }}
        >
            <div
                ref={popoverRef}
                className="element-picker-popover"
                style={{
                    top: `${popoverPosition.top}px`,
                    left: `${popoverPosition.left}px`,
                }}
                role="dialog"
                aria-label="Add element"
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* Search input stays at the top */}
                <div className="element-picker-search">
                    <div className="element-picker-search__surface">
                        <div className="element-picker-search__icon">
                            <Icon source={SearchIcon} />
                        </div>

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search elements..."
                            aria-label="Search elements"
                            autoComplete="off"
                            className="element-picker-search__input"
                        />

                        {search && (
                            <button
                                type="button"
                                className="element-picker-search__clear"
                                aria-label="Clear search"
                                onClick={() => setSearch("")}
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Only the element list scrolls */}
                <div className="element-picker-popover__scroll">
                    <div className="element-picker-popover__columns">
                        {columns.map((column, columnIndex) => (
                            <div
                                className="element-picker-column"
                                key={columnIndex}
                            >
                                {column.map(({ category, items }) => (
                                    <section
                                        className="element-picker-category"
                                        key={category}
                                    >
                                        <div className="element-picker-category__title">
                                            <Text
                                                as="h3"
                                                variant="headingSm"
                                            >
                                                {category}
                                            </Text>
                                        </div>

                                        <div className="element-picker-items">
                                            {items.map((item) => (
                                                <button
                                                    key={item.type}
                                                    type="button"
                                                    disabled={Boolean(item.disabled)}
                                                    className={[
                                                        "element-picker-item",
                                                        item.disabled
                                                            ? "is-disabled"
                                                            : "",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                    onClick={() =>
                                                        handleSelect(item)
                                                    }
                                                    title={
                                                        item.disabled
                                                            ? `${item.label} is unavailable`
                                                            : `Add ${item.label}`
                                                    }
                                                >
                                                    <span className="element-picker-item__icon">
                                                        {item.icon && (
                                                            <Icon
                                                                source={item.icon}
                                                            />
                                                        )}
                                                    </span>

                                                    <span className="element-picker-item__label">
                                                        {item.label}
                                                    </span>

                                                    {item.badge && (
                                                        <span className="element-picker-item__badge">
                                                            <Badge
                                                                tone={
                                                                    item.badge === "Hot"
                                                                        ? "warning"
                                                                        : "success"
                                                                }
                                                            >
                                                                {item.badge === "Hot"
                                                                    ? "🔥 Hot"
                                                                    : "New"}
                                                            </Badge>
                                                        </span>
                                                    )}

                                                    {item.disabled && (
                                                        <span
                                                            className="element-picker-item__locked"
                                                            aria-label="Unavailable"
                                                        >
                                                            ★
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ))}
                    </div>

                    {filteredElements.length === 0 && (
                        <div className="element-picker-empty">
                            <Text as="p" tone="subdued">
                                No elements found.
                            </Text>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
