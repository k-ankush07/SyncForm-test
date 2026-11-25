
import { useState, useRef, useCallback, useEffect } from "react";

export default function useFileField({
  savedValue,
  normalizedElement = {},
  reportChange ,
  
}) {
  const fieldId = normalizedElement.id;

  // Selected files
  const [selectedFiles, setSelectedFiles] = useState(() =>
    Array.isArray(savedValue) ? savedValue : []
  );

  // File input reference
  const fileInputRef = useRef(null);

  // Validation error
  const [fileError, setFileError] = useState("");

  // Synchronize files when saved data or field changes
  useEffect(() => {
    const nextFiles = Array.isArray(savedValue) ? savedValue : [];

    setSelectedFiles((previous) => {
      const hasSameFiles =
        previous.length === nextFiles.length &&
        previous.every((file, index) => file === nextFiles[index]);

      return hasSameFiles ? previous : nextFiles;
    });

    setFileError("");
  }, [fieldId, savedValue]);

  // File configuration
  const acceptedFileTypes = Array.isArray(
    normalizedElement.acceptedFileTypes
  )
    ? normalizedElement.acceptedFileTypes
    : [];

  const acceptAttribute = acceptedFileTypes
    .map((extension) => `.${extension}`)
    .join(",");

  const fileSizeLimit =
    Number(normalizedElement.fileSizeLimit) || 0;

  const maxFileSize = fileSizeLimit * 1024 * 1024;

  const numberOfFilesLimit =
    Number(normalizedElement.numberOfFilesLimit) || 0;

  const maxFiles = normalizedElement.allowMultiple
    ? numberOfFilesLimit
    : 1;

  // Handle file selection and validation
  const handleFileSelection = useCallback(
    (event) => {
      const incomingFiles = Array.from(
        event.target.files || []
      );

      setFileError("");

      const validFiles = [];

      for (const file of incomingFiles) {
        const extension = file.name
          .split(".")
          .pop()
          .toLowerCase();

        if (
          acceptedFileTypes.length > 0 &&
          !acceptedFileTypes.includes(extension)
        ) {
          setFileError(`.${extension} files are not allowed.`);
          continue;
        }

        if (maxFileSize > 0 && file.size > maxFileSize) {
          setFileError(
            `${file.name} exceeds the ${fileSizeLimit} MB size limit.`
          );
          continue;
        }

        validFiles.push(file);
      }

      const combinedFiles = normalizedElement.allowMultiple
        ? [...selectedFiles, ...validFiles]
        : validFiles.slice(0, 1);

      let finalFiles;

      if (maxFiles > 0 && combinedFiles.length > maxFiles) {
        setFileError(
          `You can select a maximum of ${maxFiles} files.`
        );

        finalFiles = combinedFiles.slice(0, maxFiles);
      } else {
        finalFiles = combinedFiles;
      }

      setSelectedFiles(finalFiles);
      reportChange(finalFiles);

      // Allow selecting the same file again
      event.target.value = "";
    },
    [
      acceptedFileTypes,
      maxFileSize,
      fileSizeLimit,
      normalizedElement.allowMultiple,
      selectedFiles,
      maxFiles,
      reportChange,
    ]
  );

  // Remove a selected file
  const handleFileRemove = useCallback(
    (indexToRemove) => {
      const updatedFiles = selectedFiles.filter(
        (_, index) => index !== indexToRemove
      );

      setSelectedFiles(updatedFiles);
      reportChange(updatedFiles);
    },
    [selectedFiles, reportChange]
  );

  return {
    selectedFiles,
    fileInputRef,
    fileError,
    acceptedFileTypes,
    acceptAttribute,
    handleFileSelection,
    handleFileRemove,
  };
}
