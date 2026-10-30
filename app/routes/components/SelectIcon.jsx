import React, { useMemo, useState, useEffect } from "react";

import {
    BlockStack,
    Box,
    Text,
    Button,
    ButtonGroup,
    InlineStack,
    InlineGrid,
    Icon,
    Divider,
    Scrollable,
    TextField,
    Tooltip,
} from "@shopify/polaris";

import { SearchIcon, XIcon } from "@shopify/polaris-icons";
import * as PolarisIcons from "@shopify/polaris-icons";

// All Polaris icons: { name: "AlertCircleIcon", source: <svg component> }
const ALL_ICONS = Object.entries(PolarisIcons)
    .filter(([name]) => name.endsWith("Icon"))
    .map(([name, source]) => ({ name, source }));

// "AlertCircleIcon" -> "alert circle"
const toLabel = (name) =>
    name
        .replace(/Icon$/, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase();

export default function SelectIcon({ value, onChange, onBack }) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(value || "");

    // keep local selection in sync if parent value changes
    useEffect(() => {
        setSelected(value || "");
    }, [value]);

    const filteredIcons = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ALL_ICONS;
        return ALL_ICONS.filter(({ name }) => toLabel(name).includes(q));
    }, [query]);

    const handleSelect = () => {
        if (!selected) return;
        onChange(selected);
        onBack?.();
    };

   return (
    <div
        style={{
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
        }}
    >
        {/* Header */}
        <div style={{ flexShrink: 0, paddingBottom: 12 }}>
            <InlineStack align="space-between" blockAlign="center">
                <Text variant="bodyMd" fontWeight="semibold" as="span">
                    Select icon
                </Text>

                <Button
                    icon={XIcon}
                    variant="tertiary"
                    onClick={onBack}
                    accessibilityLabel="Close"
                />
            </InlineStack>
        </div>

        {/* Search */}
        <div style={{ flexShrink: 0, paddingBottom: 12 }}>
            <TextField
                label="Search"
                labelHidden
                placeholder="Search"
                value={query}
                onChange={setQuery}
                prefix={<Icon source={SearchIcon} />}
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setQuery("")}
            />
        </div>

        {/* Icon grid */}
        <div
            style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
            }}
        >
            <Scrollable
                style={{
                    height: "100%",
                }}
                shadow
            >
                {filteredIcons.length === 0 ? (
                    <Box padding="400">
                        <Text as="p" tone="subdued" alignment="center">
                            No icons found
                        </Text>
                    </Box>
                ) : (
                    <Box padding="100">
                        <InlineGrid columns={5} gap="100">
                            {filteredIcons.map(({ name, source }) => {
                                const isSelected = selected === name;

                                return (
                                    <Tooltip key={name} content={toLabel(name)}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(name)}
                                            aria-label={toLabel(name)}
                                            aria-pressed={isSelected}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                height: 40,
                                                width: "100%",
                                                cursor: "pointer",
                                                borderRadius: 8,
                                                border: isSelected
                                                    ? "2px solid var(--p-color-border-focus)"
                                                    : "1px solid transparent",
                                                background: isSelected
                                                    ? "var(--p-color-bg-surface-selected)"
                                                    : "transparent",
                                            }}
                                        >
                                            <Icon source={source} />
                                        </button>
                                    </Tooltip>
                                );
                            })}
                        </InlineGrid>
                    </Box>
                )}
            </Scrollable>
        </div>

        {/* Footer */}
        <div
            style={{
                flexShrink: 0,
                paddingTop: 12,
            }}
        >
            <Divider />

            <Box paddingBlockStart="300">
                <ButtonGroup fullWidth>
                    <Button onClick={onBack}>Cancel</Button>

                    <Button
                        variant="primary"
                        disabled={!selected}
                        onClick={handleSelect}
                    >
                        Select
                    </Button>
                </ButtonGroup>
            </Box>
        </div>
    </div>
);
}