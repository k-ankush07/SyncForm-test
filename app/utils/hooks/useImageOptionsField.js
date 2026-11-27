
import { useState, useMemo, useCallback, useEffect } from "react";

export default function useImageOptionsField({
  savedValue,
  normalizedElement = {},
  reportChange,
  isReadOnly,
}) {
  const fieldId = normalizedElement.id;

  // -------------------------------------------------------
  // 1. IMAGE PREVIEW STATE
  // -------------------------------------------------------

  const [imagePreview, setImagePreview] = useState(() =>
    Array.isArray(savedValue)
      ? savedValue
      : savedValue
        ? [savedValue]
        : []
  );

  // Synchronize when field or saved value changes
  useEffect(() => {
    const nextImages = Array.isArray(savedValue)
      ? savedValue
      : savedValue
        ? [savedValue]
        : [];

    setImagePreview(nextImages);
  }, [fieldId, savedValue]);

  // -------------------------------------------------------
  // 2. IMAGE LIMIT
  // -------------------------------------------------------

  const maxImages = Math.max(
    1,
    Number(normalizedElement.maxImages) || 5
  );

  // -------------------------------------------------------
  // 3. SELECTED IMAGES
  // -------------------------------------------------------

  const selectedImages = useMemo(
    () => imagePreview,
    [imagePreview]
  );

  const remainingImages = Math.max(
    0,
    maxImages - selectedImages.length
  );

  // -------------------------------------------------------
  // 4. REMOVE IMAGE
  // -------------------------------------------------------

  const handleImageRemove = useCallback(
    (index) => {
      if (isReadOnly) return;

      const updatedImages = selectedImages.filter(
        (_, imageIndex) => imageIndex !== index
      );

      setImagePreview(updatedImages);
      reportChange(updatedImages);
    },
    [isReadOnly, selectedImages, reportChange]
  );

  // -------------------------------------------------------
  // 5. HANDLE IMAGE UPLOAD
  // -------------------------------------------------------

  const handleImageSelection = useCallback(
    (event) => {
      if (isReadOnly) return;

      const files = Array.from(event.target.files || []);

      const validFiles = files.filter((file) =>
        file.type.startsWith("image/")
      );

      const allowedFiles = validFiles.slice(
        0,
        remainingImages
      );

      const newImages = allowedFiles.map((file) =>
        URL.createObjectURL(file)
      );

      const updatedImages = [
        ...selectedImages,
        ...newImages,
      ];

      setImagePreview(updatedImages);
      reportChange(updatedImages);

      event.target.value = "";
    },
    [
      isReadOnly,
      remainingImages,
      selectedImages,
      reportChange,
    ]
  );

  return {
    imagePreview,
    maxImages,
    selectedImages,
    remainingImages,
    handleImageRemove,
    handleImageSelection,
  };
}
