import React, { useState } from "react";

import {
    BlockStack,
    TextField,
    Checkbox,
    Select,
    Divider,
    Text,
    Button,
    Collapsible,
    Box,
    Tag,
    InlineStack,
} from "@shopify/polaris";

const FileUploadSettings = ({ element, onChange }) => {

    const [extensionListOpen, setExtensionListOpen] = useState(false);

    // Update element settings
    const update = (key, value) => {
        onChange({
            ...element,
            [key]: value,
        });
    };

    // Available extensions
    const extensionOptions = [
        { label: "CSV", value: "csv" },
        { label: "PDF", value: "pdf" },
        { label: "JPG", value: "jpg" },
        { label: "JPEG", value: "jpeg" },
        { label: "GIF", value: "gif" },
        { label: "SVG", value: "svg" },
        { label: "PNG", value: "png" },
        { label: "WEBP", value: "webp" },
        { label: "AI", value: "ai" },
        { label: "STL", value: "stl" },
        { label: "STP", value: "stp" },
        { label: "STEP", value: "step" },
        { label: "DOC", value: "doc" },
        { label: "DOCX", value: "docx" },
        { label: "PPT", value: "ppt" },
        { label: "PPTX", value: "pptx" },
        { label: "TXT", value: "txt" },
        { label: "EX2", value: "ex2" },
        { label: "DXF", value: "dxf" },
        { label: "GBR", value: "gbr" },
        { label: "EPS", value: "eps" },
        { label: "MOV", value: "mov" },
        { label: "MP4", value: "mp4" },
        { label: "XLS", value: "xls" },
        { label: "XLSX", value: "xlsx" },
        { label: "ODS", value: "ods" },
        { label: "NUMBERS", value: "numbers" },
        { label: "XLSM", value: "xlsm" },
        { label: "ZIP", value: "zip" },
        { label: "HEIC", value: "heic" },
        { label: "HEIF", value: "heif" },
        { label: "M4V", value: "m4v" },
        { label: "OBJ", value: "obj" },
        { label: "3MF", value: "3mf" },
        { label: "DCM", value: "dcm" },
        { label: "AFM", value: "afm" },
        { label: "ASM", value: "asm" },
        { label: "X_T", value: "x_t" },
        { label: "IGS", value: "igs" },
        { label: "IGES", value: "iges" },
        { label: "STPX", value: "stpx" },
        { label: "STPXZ", value: "stpxz" },
        { label: "DWG", value: "dwg" },
        { label: "GLTF", value: "gltf" },
        { label: "GLB", value: "glb" },
        { label: "PLY", value: "ply" },
        { label: "MP3", value: "mp3" },
        { label: "WAV", value: "wav" },
        { label: "OGG", value: "ogg" },
        { label: "M4A", value: "m4a" },
        { label: "FLAC", value: "flac" },
        { label: "AAC", value: "aac" },
        { label: "DNG", value: "dng" },
        { label: "HPT", value: "hpt" },
    ];

    // Get selected extensions
    const selectedExtensions = Array.isArray(element.acceptedFileTypes)
        ? element.acceptedFileTypes
        : [];

    // Select or deselect extension
    const handleExtensionSelect = (extension, checked) => {
        const updatedExtensions = checked
            ? [...selectedExtensions, extension]
            : selectedExtensions.filter((item) => item !== extension);

        update("acceptedFileTypes", updatedExtensions);
    };

    // Remove selected extension
    const removeExtension = (extension) => {
        update(
            "acceptedFileTypes",
            selectedExtensions.filter((item) => item !== extension)
        );
    };

    return (
        <BlockStack gap="300">

            {/* Button Text */}
            <TextField
                label="Button text"
                value={element.buttonText || "Browse file"}
                onChange={(value) => update("buttonText", value)}
                autoComplete="off"
            />

            {/* Placeholder */}
            <TextField
                label="Placeholder"
                value={element.placeholder || "Choose file or drag here"}
                onChange={(value) => update("placeholder", value)}
                autoComplete="off"
            />

            {/* Hint */}
            <TextField
                label="Hint"
                value={element.hint || "PNG, GIF, SVG."}
                onChange={(value) => update("hint", value)}
                autoComplete="off"
            />

            {/* Allow Multiple */}
            <Checkbox
                label="Allow multiple"
                checked={Boolean(element.allowMultiple)}
                onChange={(value) => update("allowMultiple", value)}
            />

            <Divider />

            {/* Allowed Extensions */}
            <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                    Allowed extensions
                </Text>

                {/* Selected tags live OUTSIDE the button */}
                {selectedExtensions.length > 0 && (
                    <InlineStack gap="100" wrap>
                        {selectedExtensions.map((extension) => (
                            <Tag
                                key={extension}
                                onRemove={() => removeExtension(extension)}
                            >
                                {extension}
                            </Tag>
                        ))}
                    </InlineStack>
                )}

                <Button
                    fullWidth
                    textAlign="start"
                    disclosure={extensionListOpen ? "up" : "down"}
                    onClick={() => setExtensionListOpen((open) => !open)}
                    ariaExpanded={extensionListOpen}
                    ariaControls="extension-list"
                >
                    {selectedExtensions.length > 0
                        ? `${selectedExtensions.length} selected`
                        : "Select extensions"}
                </Button>

                {/* Inline list: no portal, so no z-index / overflow clipping */}
                <Collapsible
                    open={extensionListOpen}
                    id="extension-list"
                    transition={{ duration: "150ms", timingFunction: "ease-in-out" }}
                >
                    <Box
                        padding="200"
                        borderWidth="025"
                        borderColor="border"
                        borderRadius="200"
                    >
                        <div
                            style={{
                                maxHeight: "220px",
                                overflowY: "auto",
                                overflowX: "hidden",
                            }}
                        >
                            <BlockStack gap="200">
                                {extensionOptions.map((option) => (
                                    <Checkbox
                                        key={option.value}
                                        label={option.label}
                                        checked={selectedExtensions.includes(option.value)}
                                        onChange={(checked) =>
                                            handleExtensionSelect(option.value, checked)
                                        }
                                    />
                                ))}
                            </BlockStack>
                        </div>
                    </Box>
                </Collapsible>
            </BlockStack>

            <Divider />

            {/* File Size Limit */}
            <TextField
                label="File size limit"
                type="number"
                value={String(element.fileSizeLimit ?? "")}
                onChange={(value) => update("fileSizeLimit", value)}
                suffix="MB"
                autoComplete="off"
            />

            <Text as="p" variant="bodySm" tone="subdued">
                Your current plan allows for a maximum file size of 20MB
            </Text>

            {/* Access Policy */}
            <Select
                label="Access policy"
                options={[
                    { label: "Public", value: "public" },
                    { label: "Private", value: "private" },
                ]}
                value={element.accessPolicy || "public"}
                onChange={(value) => update("accessPolicy", value)}
            />

            <Text as="p" variant="bodySm" tone="subdued">
                If public, the file will be accessible to everyone.
                If private, the file will be accessible via app admin.
            </Text>

            {/* Third Party Storage */}
            <Select
                label="Also upload to third party storage"
                options={[
                    { label: "None", value: "none" },
                ]}
                value={element.thirdPartyStorage || "none"}
                onChange={(value) => update("thirdPartyStorage", value)}
                disabled
            />

            <Text as="p" variant="bodySm" tone="subdued">
                Mirror uploaded files to a connected third party storage.
            </Text>

            <Text as="p" variant="bodySm" tone="subdued">
                This feature is available in our PRO plan.
            </Text>

            <Divider />

            {/* Number of Files Limit */}
            <TextField
                label="Number of files limit"
                type="number"
                value={String(element.numberOfFilesLimit ?? "")}
                onChange={(value) => update("numberOfFilesLimit", value)}
                autoComplete="off"
            />

        </BlockStack>
    );
};

export default FileUploadSettings;