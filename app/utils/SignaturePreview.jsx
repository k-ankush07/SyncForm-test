 import React, { useEffect, useState, useRef } from "react";
 import SignaturePad from "signature_pad";
 import {
  Icon,
  Text,
  TextField,
  Checkbox,
  Select,
  InlineStack,
  Button,
  BlockStack,
} from "@shopify/polaris";
import * as PolarisIcons from "@shopify/polaris-icons";
 export default function SignaturePreview({
  element,
  label,
  hideLabel,
  required,
  descriptionText,
  isReadOnly,
  onChange,
}) {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const uploadedPreviewUrlRef = useRef(null);

  const [uploadedSignature, setUploadedSignature] = useState(null);

  // Always use the latest callback without recreating SignaturePad.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const showCanvas = element.showCanvas !== false;
  const allowFileUpload = element.allowFileUpload === true;

  const canvasHeight = Number(element.canvasHeight) || 150;
  const penColor = element.penColor || "#000000";
  const penWidth = Number(element.penWidth) || 2;
  const canvasBackground = element.canvasBackground || "#ffffff";

  // Create and configure SignaturePad.
  useEffect(() => {
    if (!showCanvas || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const signaturePad = new SignaturePad(canvas, {
      penColor,
      minWidth: penWidth,
      maxWidth: penWidth,
      backgroundColor: canvasBackground,
    });

    signaturePadRef.current = signaturePad;

    // Send the completed drawing to the parent.
    const handleEndStroke = () => {
      if (signaturePad.isEmpty()) {
        onChangeRef.current?.(null);
        return;
      }

      onChangeRef.current?.({
        type: "drawn",
        dataUrl: signaturePad.toDataURL("image/png"),
      });
    };

    signaturePad.addEventListener("endStroke", handleEndStroke);

    // Resize the canvas without losing an existing drawing.
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      const drawingData = signaturePad.isEmpty()
        ? null
        : signaturePad.toData();

      canvas.width = Math.max(1, canvas.offsetWidth * ratio);
      canvas.height = Math.max(1, canvasHeight * ratio);

      const context = canvas.getContext("2d");

      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      signaturePad.clear();

      if (drawingData) {
        signaturePad.fromData(drawingData);
      }
    };

    resizeCanvas();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resizeCanvas)
        : null;

    resizeObserver?.observe(canvas);

    return () => {
      resizeObserver?.disconnect();
      signaturePad.removeEventListener("endStroke", handleEndStroke);
      signaturePad.off();

      if (signaturePadRef.current === signaturePad) {
        signaturePadRef.current = null;
      }
    };
  }, [
    element.id,
    showCanvas,
    canvasHeight,
    penColor,
    penWidth,
    canvasBackground,
  ]);

  // Release the previous upload preview URL when replaced.
  const handleSignatureUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (uploadedPreviewUrlRef.current) {
      URL.revokeObjectURL(uploadedPreviewUrlRef.current);
    }

    uploadedPreviewUrlRef.current = previewUrl;

    setUploadedSignature({
      file,
      previewUrl,
    });

    // Send the actual File object to the parent.
    onChangeRef.current?.({
      type: "uploaded",
      file,
    });

    // Allow selecting the same file again.
    event.target.value = "";
  };

  // Revoke the final preview URL when this component unmounts.
  useEffect(() => {
    return () => {
      if (uploadedPreviewUrlRef.current) {
        URL.revokeObjectURL(uploadedPreviewUrlRef.current);
        uploadedPreviewUrlRef.current = null;
      }
    };
  }, []);

  // Clear the drawing and notify the parent.
  const clearSignature = () => {
    signaturePadRef.current?.clear();
    onChangeRef.current?.(null);
  };

  return (
    <BlockStack gap="200">
      {!hideLabel && (
        <Text as="p" variant="bodyMd">
          {label}
          {required && (
            <span style={{ color: "var(--p-color-text-critical)" }}>
              {" "}*
            </span>
          )}
        </Text>
      )}

      {/* Signature drawing canvas. */}
      {showCanvas && (
        <BlockStack gap="200">
          <div
            style={{
              border: "1px dashed #8c9196",
              borderRadius: "8px",
              overflow: "hidden",
              background: canvasBackground,
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                width: "100%",
                height: `${canvasHeight}px`,
                touchAction: isReadOnly ? "auto" : "none",
                cursor: isReadOnly ? "default" : "crosshair",
                pointerEvents: isReadOnly ? "none" : "auto",
              }}
            />
          </div>

          {element.allowClear !== false && (
            <InlineStack align="end">
              <Button
                size="slim"
                onClick={clearSignature}
                disabled={isReadOnly}
              >
                Clear signature
              </Button>
            </InlineStack>
          )}
        </BlockStack>
      )}

      {/* Separator when both drawing and uploading are enabled. */}
      {showCanvas && allowFileUpload && (
        <Text as="p" variant="bodySm" tone="subdued">
          OR
        </Text>
      )}

      {/* Signature image upload. */}
      {allowFileUpload && (
        <BlockStack gap="200">
          {uploadedSignature ? (
            <BlockStack gap="200">
              <img
                src={uploadedSignature.previewUrl}
                alt="Uploaded signature"
                style={{
                  maxWidth: "100%",
                  maxHeight: "150px",
                  objectFit: "contain",
                  border: "1px solid #e1e3e5",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              />

              {element.allowReplace !== false && (
                <label
                  style={{
                    cursor: isReadOnly ? "default" : "pointer",
                    pointerEvents: isReadOnly ? "none" : "auto",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "7px 14px",
                      border: "1px solid #8c9196",
                      borderRadius: "6px",
                    }}
                  >
                    Replace signature
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    disabled={isReadOnly}
                    onChange={handleSignatureUpload}
                  />
                </label>
              )}
            </BlockStack>
          ) : (
            <label
              style={{
                border: "1px dashed #8c9196",
                borderRadius: "8px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                cursor: isReadOnly ? "default" : "pointer",
                pointerEvents: isReadOnly ? "none" : "auto",
              }}
            >
              <Icon source={PolarisIcons.UploadIcon} />

              <Text as="span" variant="bodyMd">
                {element.uploadButtonText || "Upload signature"}
              </Text>

              <Text as="span" variant="bodySm" tone="subdued">
                {element.acceptedFileTypes || "PNG, JPG, JPEG"}
              </Text>

              <input
                type="file"
                accept="image/png,image/jpeg"
                hidden
                disabled={isReadOnly}
                onChange={handleSignatureUpload}
              />
            </label>
          )}
        </BlockStack>
      )}

      {descriptionText}
    </BlockStack>
  );
}