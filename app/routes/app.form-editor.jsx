import React, { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";

import { normalizeFormPages } from "../utils/normalizeFormPages.js";
import ElementSettings from "../routes/components/ElementSettings.jsx";
import { createElementConfig } from "../utils/elementHelpers.js";
import ElementPickerPopover from "../routes/components/ElementPickerPopover.jsx";


import {
  MenuHorizontalIcon,
  LanguageIcon,
  CursorIcon,
  MobileIcon,
  UndoIcon,
  RedoIcon,
} from "@shopify/polaris-icons";


import {
  BlockStack,
  Box,
  Button,
  Divider,
  Text,
  Icon,
  Tooltip,
  InlineStack,
  Badge,
  ButtonGroup,
  Card,
} from "@shopify/polaris";

import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { arrayMove } from "@dnd-kit/sortable";

import {
  FormsIcon,
  PaintBrushFlatIcon,
  CheckCircleIcon,
  EmailIcon,
  AppsIcon,
  SettingsIcon,
  MagicIcon,
  LanguageTranslateIcon,
  MenuIcon,
} from "@shopify/polaris-icons";

import ElementsPanel from "../routes/components/ElementsPanel";
import LivePreview from "../routes/components/LivePreview";

import { useSearchParams } from "react-router";
import { templates } from "../utils/templates.js";




// =========================================
// HELPER: NORMALIZE ROWS
//
// 1. Remove rows that contain no elements.
// 2. If a row contains only one element,
//    move that element into rootElements.
// 3. Keep rows containing two or more elements.
//
// This keeps ElementsPanel and LivePreview
// synchronized through the shared pages state.
// =========================================

const normalizeRows = (pages) =>
  pages.map((page) => {
    const rootElements = [...(page.rootElements ?? [])];
    const updatedRows = [];

    (page.rows ?? []).forEach((row) => {
      const fields = row.fields ?? [];
      const elements = row.elements ?? [];

      const totalElements = fields.length + elements.length;

      // CASE 1: Remove completely empty rows.
      if (totalElements === 0) {
        return;
      }

      // CASE 2: Convert a single-element row into a root element.
      if (totalElements === 1) {
        const remainingElement = fields[0] ?? elements[0];

        // Prevent accidentally adding the same element twice.
        const alreadyExists = rootElements.some(
          (item) => item.id === remainingElement.id
        );

        if (!alreadyExists) {
          rootElements.push(remainingElement);
        }

        return;
      }

      // CASE 3: Keep rows containing two or more elements.
      updatedRows.push({
        ...row,
        fields,
        elements,
      });
    });

    return {
      ...page,
      rows: updatedRows,
      rootElements,
    };
  });

// Creates a duplicate of an object-based element
// with a new ID and new option IDs.
const createDuplicateElement = (element) => {
  if (!element || typeof element !== "object") {
    return element;
  }

  return {
    ...element,
    id: crypto.randomUUID(),
    options: (element.options ?? []).map((option) =>
      typeof option === "object" && option !== null
        ? { ...option, id: crypto.randomUUID() }
        : option
    ),
  };
};

export default function FormEditor() {
  const [searchParams] = useSearchParams();

  const templateId = searchParams.get("templateId");
  const templateTitle = searchParams.get("title") || "Form editor";
  // header preview
  const [isModelPreview, setIsModelPreview] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  // Main editor states.
  const [selectedOption, setSelectedOption] = useState("Elements");
  const [collpase, setCollapse] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);

  // elemnt poper states
  // Show whether the element picker modal is open or not.
  const [elementPickerOpen, setElementPickerOpen] = useState(false);
  const [elementTarget, setElementTarget] = useState(null);
  const [elementPickerColumns, setElementPickerColumns] = useState(4);
  // position 
  const [elementPickerPosition, setElementPickerPosition] = useState({
    top: 150,
    left: 490,
  });


  // Get actual Shopify products
  const productFetcher = useFetcher();

  const [shopifyProducts, setShopifyProducts] = useState([]);

  const [productPageInfo, setProductPageInfo] = useState({
    hasNextPage: false,
    endCursor: null,
  });

  const appendProductsRef = useRef(false);

  // Fetch first 5 products
  useEffect(() => {
    if (productFetcher.state === "idle" && !productFetcher.data) {
      productFetcher.load("/app/products");
    }
  }, []);

  // Receive products from Shopify
  useEffect(() => {
    if (!productFetcher.data) return;

    const newProducts = productFetcher.data.products || [];

    // Capture the value BEFORE resetting the ref.
    const shouldAppend = appendProductsRef.current;

    setShopifyProducts((previousProducts) => {
      if (!shouldAppend) {
        return newProducts;
      }

      const existingIds = new Set(
        previousProducts.map((product) => product.id)
      );

      const uniqueNewProducts = newProducts.filter(
        (product) => !existingIds.has(product.id)
      );

      return [...previousProducts, ...uniqueNewProducts];
    });

    setProductPageInfo(
      productFetcher.data.pageInfo || {
        hasNextPage: false,
        endCursor: null,
      }
    );

    appendProductsRef.current = false;
  }, [productFetcher.data]);

  // Fetch next 5 products ONLY when Load More is clicked
  const loadMoreProducts = () => {
    if (
      !productPageInfo.hasNextPage ||
      !productPageInfo.endCursor ||
      productFetcher.state !== "idle"
    ) {
      return;
    }

    appendProductsRef.current = true;

    const params = new URLSearchParams({
      after: productPageInfo.endCursor,
    });

    productFetcher.load(`/app/products?${params.toString()}`);
  };

  // Loading states
  const productsLoading =
    productFetcher.state === "loading" &&
    shopifyProducts.length === 0;

  const productsLoadingMore =
    productFetcher.state === "loading" &&
    shopifyProducts.length > 0;

  // =========================================
  // FUNCTION: OPEN ELEMENT PICKER
  // Opens the same picker from ElementsPanel
  // or from LivePreview.
  // =========================================

  const openElementPicker = (
    targetOrPageId,
    rowIdOrEvent = null,
    maybeEvent,
    extraTarget = {}
  ) => {
    const isPreviewTarget =
      typeof targetOrPageId === "object" && targetOrPageId !== null;

    setElementPickerColumns(isPreviewTarget ? 2 : 4);

    const target = isPreviewTarget
      ? targetOrPageId
      : {
        pageId: targetOrPageId,
        rowId: rowIdOrEvent ?? null,
        ...extraTarget,
      };

    const event = isPreviewTarget ? rowIdOrEvent : maybeEvent;

    let top = 150;
    let left = 490;

    if (event?.currentTarget) {
      const buttonRect = event.currentTarget.getBoundingClientRect();

      const modalWidth = isPreviewTarget
        ? Math.min(480, window.innerWidth - 16)
        : Math.min(800, window.innerWidth - 16);

      const modalHeight = Math.min(430, window.innerHeight - 24);

      left = buttonRect.right + 8;

      if (left + modalWidth > window.innerWidth - 12) {
        left = buttonRect.left - modalWidth - 8;
      }

      left = Math.max(
        12,
        Math.min(left, window.innerWidth - modalWidth - 12)
      );

      top = Math.max(
        12,
        Math.min(
          buttonRect.top - 20,
          window.innerHeight - modalHeight - 12
        )
      );
    }

    setElementPickerPosition({ top, left });
    setElementTarget(target);
    setElementPickerOpen(true);
  };


  // =========================================
  // FUNCTION: SELECT AN ELEMENT
  // Adds the selected element at the requested
  // position or appends it from the sidebar.
  // =========================================

  const handleSelectElement = (item) => {
    if (!elementTarget || !item?.type) return;

    const newElement = createElementConfig(item);

    setPages((previousPages) =>
      previousPages.map((page) => {
        if (page.id !== elementTarget.pageId) return page;

        const {
          rowId,
          elementId,
          collection,
          placement,
          insertIndex,
        } = elementTarget;


        // =========================================
        // CASE 0: INSERT A NEW ROW BETWEEN ROWS
        // Used by the plus button in LivePreview.
        // =========================================

        if (
          collection === "rows" &&
          rowId != null &&
          (placement === "before" || placement === "after")
        ) {
          const rows = [...(page.rows || [])];

          const targetIndex = rows.findIndex(
            (row) => row.id === rowId
          );

          if (targetIndex === -1) return page;

          // Create a new row containing the selected element.
          const newRow = {
            id: crypto.randomUUID(),
            fields: [],
            elements: [newElement],
          };

          // Insert before or after the target row.
          rows.splice(
            placement === "before"
              ? targetIndex
              : targetIndex + 1,
            0,
            newRow
          );

          return {
            ...page,
            rows,
          };
        }


        // =========================================
        // CASE 1: PREVIEW INSERTION INTO A ROW
        // Insert before or after the selected element.
        // =========================================

        if (rowId != null && elementId != null) {
          return {
            ...page,

            rows: (page.rows || []).map((row) => {
              if (row.id !== rowId) return row;

              const targetCollection =
                collection === "fields" ? "fields" : "elements";

              const items = [...(row[targetCollection] || [])];

              const targetIndex = items.findIndex(
                (element) => element.id === elementId
              );

              if (targetIndex === -1) return row;

              items.splice(
                placement === "left" || placement === "top"
                  ? targetIndex
                  : targetIndex + 1,
                0,
                newElement
              );

              return {
                ...row,
                [targetCollection]: items,
              };
            }),
          };
        }

        // =========================================
        // CASE 2: PREVIEW INSERTION BESIDE A ROOT ELEMENT
        // Convert the target and new element into a row.
        // =========================================

        if (
          rowId == null &&
          elementId != null &&
          (placement === "left" || placement === "right")
        ) {
          const rootElements = [...(page.rootElements || [])];

          const targetIndex = rootElements.findIndex(
            (element) => element.id === elementId
          );

          if (targetIndex === -1) return page;

          const targetElement = rootElements.splice(targetIndex, 1)[0];

          const newRow = {
            id: crypto.randomUUID(),
            fields: [],
            elements:
              placement === "left"
                ? [newElement, targetElement]
                : [targetElement, newElement],
          };

          return {
            ...page,
            rootElements,
            rows: [...(page.rows || []), newRow],
          };
        }

        // =========================================
        // CASE 3: PREVIEW INSERTION ABOVE OR BELOW
        // A root element.
        // =========================================

        if (
          rowId == null &&
          elementId != null &&
          (placement === "top" || placement === "bottom")
        ) {
          const rootElements = [...(page.rootElements || [])];

          const targetIndex = rootElements.findIndex(
            (element) => element.id === elementId
          );

          if (targetIndex === -1) return page;

          rootElements.splice(
            placement === "top" ? targetIndex : targetIndex + 1,
            0,
            newElement
          );

          return {
            ...page,
            rootElements,
          };
        }

        // =========================================
        // CASE 4: SIDEBAR ADD ELEMENT
        // Keep the existing append behavior.
        // =========================================

        if (rowId != null) {
          return {
            ...page,

            rows: (page.rows || []).map((row) =>
              row.id !== rowId
                ? row
                : {
                  ...row,
                  elements: [
                    ...(row.elements || []),
                    newElement,
                  ],
                }
            ),
          };
        }
        // =========================================
        // CASE 5: SIDEBAR INSERTION AT A SPECIFIC POSITION
        // =========================================

        if (rowId == null && Number.isInteger(insertIndex)) {
          const rootElements = [...(page.rootElements || [])];

          const safeIndex = Math.max(
            0,
            Math.min(insertIndex, rootElements.length)
          );

          rootElements.splice(safeIndex, 0, newElement);

          return {
            ...page,
            rootElements,
          };
        }

        // =========================================
        // CASE 6: NORMAL SIDEBAR ADD ELEMENT
        // Keep existing append behavior.
        // =========================================

        return {
          ...page,
          rootElements: [
            ...(page.rootElements || []),
            newElement,
          ],
        };
      })
    );

    setElementPickerOpen(false);
    setElementTarget(null);
  };

  const sidebarOptions = [
    { label: "Elements", icon: FormsIcon },
    { label: "Edit with AI", icon: MagicIcon },
    { label: "Appearance", icon: PaintBrushFlatIcon },
    { label: "After submit", icon: CheckCircleIcon },
    { label: "Mail", icon: EmailIcon },
    { label: "Integration", icon: AppsIcon },
    { label: "Settings", icon: SettingsIcon },
    { label: "Translation", icon: LanguageTranslateIcon },
  ];

  // =========================================
  // TEMPLATE AND DEFAULT PAGE
  // =========================================

  const selectedTemplate = templates.find(
    (template) => String(template.id) === templateId
  );

  // Default page used when no template is selected.
  const defaultPages = {
    id: 1,
    label: "Page 1",
    open: true,

    rows: [
      {
        id: 101,
        fields: ["First Name", "Last Name"],
        elements: [],
      },
      {
        id: 102,
        fields: ["Email", "Phone"],
        elements: [],
      },
    ],

    rootElements: [],

    // Default submit button for this page.
    submitButton: {
      label: "Submit",
      enabled: true,
    },
  };

  // =========================================
  // SHARED FORM HEADER AND FOOTER
  // These belong to the whole form, not individual pages.
  // =========================================

  // Default Header settings.
  const defaultHeader = {
    id: 100,
    type: "form_header",
    label: "form_header",

    title: "Contact us",
    description: "Leave your message and we'll get back to you shortly.",

    showHeader: true,
    headingTag: "h2",
    alignment: "left",

    visible: true,
  };

  // Default Footer settings.
  const defaultFooter = {
    id: 104,
    type: "form_footer",
    label: "form_footer",

    // Footer content
    text: "",
    content: "",
    bottomDescription: "",

    // Navigation buttons
    showPreviousButton: false,
    showNextButton: false,
    previousText: "Previous",
    nextText: "Next",

    // Submit button
    submitText: "Send message",

    // Reset button
    showResetButton: false,
    resetButtonText: "Reset",

    // Footer description
    showDescriptionAtBottom: true,

    // Submit button appearance
    fullWidthButton: true,
    buttonBackgroundColor: "#2E4E49",
    buttonTextColor: "#ffffff",
    buttonAlignment: "left",

    visible: true,
  };

  // Find existing Header and Footer from the selected template.
  // Templates without Header/Footer will use the defaults.
  const templateHeader = selectedTemplate?.pages?.find(
    (page) => page.header
  )?.header;

  const templateFooter = selectedTemplate?.pages?.find(
    (page) => page.footer
  )?.footer;

  // Initialize shared Header state.
  // Template settings override defaults, while missing properties
  // are filled in from defaultHeader.
  const [header, setHeader] = useState(() => ({
    ...defaultHeader,
    ...(templateHeader ?? {}),
  }));

  // Initialize shared Footer state.
  // Existing template settings are preserved.
  // Missing properties receive the default values.
  const [footer, setFooter] = useState(() => ({
    ...defaultFooter,
    ...(templateFooter ?? {}),

    // Ensure these appearance defaults exist on older templates.
    fullWidthButton: templateFooter?.fullWidthButton ?? true,
    buttonBackgroundColor:
      templateFooter?.buttonBackgroundColor ?? "#2E4E49",
    buttonTextColor:
      templateFooter?.buttonTextColor ?? "#ffffff",
  }));

  // Keep your existing pages state.
  // Remove page-level header/footer because they are now shared.
  const [pages, setPages] = useState(() =>
    normalizeFormPages(
      selectedTemplate?.pages ?? [defaultPages]
    ).map(({ header, footer, ...page }) => page)
  );

  // =========================================
  // DRAG AND DROP SENSORS
  // =========================================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // =========================================
  // ELEMENTS PANEL DRAG END
  // Handles page sorting, row sorting and
  // moving sidebar elements.
  // =========================================

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    // Reorder pages.
    if (activeData.type === "page" && overData.type === "page") {
      setPages((previousPages) => {
        const oldIndex = previousPages.findIndex(
          (page) => `page-${page.id}` === active.id
        );

        const newIndex = previousPages.findIndex(
          (page) => `page-${page.id}` === over.id
        );

        if (oldIndex === -1 || newIndex === -1) {
          return previousPages;
        }

        return arrayMove(previousPages, oldIndex, newIndex);
      });

      return;
    }

    // Reorder rows.
    if (activeData.type === "row" && overData.type === "row") {
      if (activeData.pageId !== overData.pageId) return;

      setPages((previousPages) =>
        previousPages.map((page) => {
          if (page.id !== activeData.pageId) return page;

          const currentRows = page.rows ?? [];

          const oldIndex = currentRows.findIndex(
            (row) => row.id === activeData.rowId
          );

          const newIndex = currentRows.findIndex(
            (row) => row.id === overData.rowId
          );

          if (oldIndex === -1 || newIndex === -1) return page;

          return {
            ...page,
            rows: arrayMove(currentRows, oldIndex, newIndex),
          };
        })
      );

      return;
    }

    // Move fields and created elements from the ElementsPanel.
    if (
      ["field", "element", "rootElement"].includes(activeData.type)
    ) {
      moveElementBetweenLocations(activeData, overData);
    }
  };


  // =========================================
  // UPDATE SELECTED ELEMENT
  // Used by ElementSettings.
  //
  // Header and footer update their shared state.
  // Normal elements continue updating inside pages.
  // =========================================

  const updateSelectedElement = (updatedElement) => {
    // CASE 1: Update the shared form header.
    if (updatedElement.type === "form_header") {
      setHeader(updatedElement);
      setSelectedElement(updatedElement);
      return;
    }

    // CASE 2: Update the shared form footer.
    if (updatedElement.type === "form_footer") {
      setFooter(updatedElement);
      setSelectedElement(updatedElement);
      return;
    }

    // CASE 3: Update a normal page element.
    setPages((previousPages) =>
      previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => ({
          ...row,

          fields: (row.fields ?? []).map((field) =>
            field?.id === updatedElement.id
              ? updatedElement
              : field
          ),

          elements: (row.elements ?? []).map((element) =>
            element?.id === updatedElement.id
              ? updatedElement
              : element
          ),
        })),

        rootElements: (page.rootElements ?? []).map((element) =>
          element?.id === updatedElement.id
            ? updatedElement
            : element
        ),
      }))
    );

    setSelectedElement(updatedElement);
  };

  // =========================================
  // UPDATE ELEMENT IN PAGES
  // Shared helper for updating element properties.
  // =========================================

  const updateElementInPages = (currentPages, elementId, updater) =>
    currentPages.map((page) => ({
      ...page,

      rows: (page.rows ?? []).map((row) => ({
        ...row,

        fields: (row.fields ?? []).map((item) =>
          item?.id === elementId ? updater(item) : item
        ),

        elements: (row.elements ?? []).map((item) =>
          item?.id === elementId ? updater(item) : item
        ),
      })),

      rootElements: (page.rootElements ?? []).map((item) =>
        item?.id === elementId ? updater(item) : item
      ),
    }));

  // =========================================
  // SHOW OR HIDE ELEMENT
  // =========================================

  const handleToggleElementVisibility = (element) => {
    const updatedElement = {
      ...element,
      visible: element.visible === false,
    };

    setPages((previousPages) =>
      updateElementInPages(
        previousPages,
        element.id,
        () => updatedElement
      )
    );

    //setSelectedElement(updatedElement);
  };

  // =========================================
  // DELETE ELEMENT
  //
  // After deleting:
  // - Empty rows are removed.
  // - Rows with one remaining element become root elements.
  // =========================================

  const handleDeleteElement = (element) => {
    const removeElement = (items) =>
      (items ?? []).filter((item) => item?.id !== element.id);

    setPages((previousPages) => {
      const updatedPages = previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => ({
          ...row,
          fields: removeElement(row.fields),
          elements: removeElement(row.elements),
        })),

        rootElements: removeElement(page.rootElements),
      }));

      // Normalize rows after deleting the element.
      return normalizeRows(updatedPages);
    });

    setSelectedElement(null);
  };

  // =========================================
  // DUPLICATE ELEMENT
  // Insert the duplicate immediately after
  // the original element.
  // =========================================

  const handleDuplicateElement = (element) => {
    const duplicate = {
      ...element,
      id: crypto.randomUUID(),
      label: `${element.label || "Field"}`,

      options: (element.options ?? []).map((option) =>
        typeof option === "object"
          ? { ...option, id: crypto.randomUUID() }
          : option
      ),
    };

    setPages((previousPages) =>
      previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => {
          const insertAfter = (items) => {
            const index = items.findIndex(
              (item) => item?.id === element.id
            );

            if (index === -1) return items;

            return [
              ...items.slice(0, index + 1),
              duplicate,
              ...items.slice(index + 1),
            ];
          };

          return {
            ...row,
            fields: insertAfter(row.fields ?? []),
            elements: insertAfter(row.elements ?? []),
          };
        }),

        rootElements: (() => {
          const items = page.rootElements ?? [];

          const index = items.findIndex(
            (item) => item?.id === element.id
          );

          if (index === -1) return items;

          return [
            ...items.slice(0, index + 1),
            duplicate,
            ...items.slice(index + 1),
          ];
        })(),
      }))
    );

    //  setSelectedElement(duplicate);
  };

  // =========================================
  // ROW ACTIONS
  // Show or hide, duplicate, and delete rows.
  // =========================================

  const handleToggleRowVisibility = (pageId, rowId) => {
    setPages((previousPages) =>
      previousPages.map((page) =>
        page.id !== pageId
          ? page
          : {
            ...page,
            rows: (page.rows ?? []).map((row) =>
              row.id === rowId
                ? { ...row, visible: row.visible === false }
                : row
            ),
          }
      )
    );
  };

  const handleDuplicateRow = (pageId, rowId) => {
    setPages((previousPages) =>
      previousPages.map((page) => {
        if (page.id !== pageId) return page;

        const rowIndex = (page.rows ?? []).findIndex(
          (row) => row.id === rowId
        );

        if (rowIndex === -1) return page;

        const originalRow = page.rows[rowIndex];

        const duplicateRow = {
          ...originalRow,
          id: crypto.randomUUID(),

          fields: (originalRow.fields ?? []).map((field) =>
            typeof field === "object" && field !== null
              ? createDuplicateElement(field)
              : field
          ),

          elements: (originalRow.elements ?? []).map(
            createDuplicateElement
          ),
        };

        const updatedRows = [...page.rows];

        updatedRows.splice(rowIndex + 1, 0, duplicateRow);

        return {
          ...page,
          rows: updatedRows,
        };
      })
    );
  };

  const handleDeleteRow = (pageId, rowId) => {
    const deletedRow = pages
      .find((page) => page.id === pageId)
      ?.rows?.find((row) => row.id === rowId);

    const deletedElementIds = [
      ...(deletedRow?.fields ?? []),
      ...(deletedRow?.elements ?? []),
    ]
      .filter((item) => typeof item === "object" && item !== null)
      .map((item) => item.id);

    setPages((previousPages) =>
      previousPages.map((page) =>
        page.id !== pageId
          ? page
          : {
            ...page,
            rows: (page.rows ?? []).filter(
              (row) => row.id !== rowId
            ),
          }
      )
    );

    setSelectedElement((previousElement) =>
      previousElement &&
        deletedElementIds.includes(previousElement.id)
        ? null
        : previousElement
    );
  };

  // =========================================
  // PAGE ACTIONS
  // Duplicate a page and all its rows/elements.
  // =========================================

  const handleDuplicatePage = (pageId) => {
    setPages((previousPages) => {
      const pageIndex = previousPages.findIndex(
        (page) => page.id === pageId
      );

      if (pageIndex === -1) return previousPages;

      const originalPage = previousPages[pageIndex];

      const duplicatePage = {
        ...originalPage,
        id: crypto.randomUUID(),
        label: `${originalPage.label} Copy`,
        open: true,

        rows: (originalPage.rows ?? []).map((row) => ({
          ...row,
          id: crypto.randomUUID(),

          fields: (row.fields ?? []).map((field) =>
            typeof field === "object" && field !== null
              ? createDuplicateElement(field)
              : field
          ),

          elements: (row.elements ?? []).map(
            createDuplicateElement
          ),
        })),

        rootElements: (originalPage.rootElements ?? []).map(
          createDuplicateElement
        ),

        submitButton: originalPage.submitButton
          ? { ...originalPage.submitButton }
          : originalPage.submitButton,
      };

      const updatedPages = previousPages.map((page) => ({
        ...page,
        open: false,
      }));

      updatedPages.splice(pageIndex + 1, 0, duplicatePage);

      return updatedPages;
    });

    setSelectedElement(null);
  };

  // =========================================
  // PREVIEW DRAG AND DROP
  // This handler is separate from the
  // ElementsPanel drag handler.
  // =========================================

  const handlePreviewDragEnd = ({ active, over }) => {
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (
      !activeData ||
      !overData ||
      activeData.type !== "previewElement"
    ) {
      return;
    }

    setPages((previousPages) => {
      // Clone page data to avoid mutating React state.
      const updatedPages = previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => ({
          ...row,
          fields: [...(row.fields ?? [])],
          elements: [...(row.elements ?? [])],
        })),

        rootElements: [...(page.rootElements ?? [])],
      }));

      // Find the source page.
      const sourcePage = updatedPages.find(
        (page) => page.id === activeData.pageId
      );

      if (!sourcePage) return previousPages;

      let draggedElement = null;

      // Remove the element from its original collection.
      if (activeData.collection === "rootElements") {
        const index = sourcePage.rootElements.findIndex(
          (item) => item.id === activeData.elementId
        );

        if (index !== -1) {
          [draggedElement] = sourcePage.rootElements.splice(index, 1);
        }
      } else {
        const sourceRow = sourcePage.rows.find(
          (row) => row.id === activeData.rowId
        );

        if (!sourceRow) return previousPages;

        const sourceItems = sourceRow[activeData.collection];

        if (!Array.isArray(sourceItems)) return previousPages;

        const index = sourceItems.findIndex(
          (item) => item.id === activeData.elementId
        );

        if (index !== -1) {
          [draggedElement] = sourceItems.splice(index, 1);
        }
      }

      if (!draggedElement) return previousPages;

      // Find the destination page.
      const targetPage = updatedPages.find(
        (page) => page.id === overData.pageId
      );

      if (!targetPage) return previousPages;

      // CASE 1:
      // Drop outside a row.
      // Move the element into rootElements (full width).
      if (overData.type === "rootDrop") {
        targetPage.rootElements.push(draggedElement);

        // Normalize after completing the drop.
        return normalizeRows(updatedPages);
      }

      if (overData.type !== "previewDrop") {
        return previousPages;
      }

      const {
        placement,
        targetRowId,
        targetElementId,
      } = overData;

      // CASE 2:
      // Drop above or below another element.
      // Create a new full-width row.
      if (placement === "top" || placement === "bottom") {
        // If the target is a root element,
        // insert into rootElements instead.
        if (overData.targetCollection === "rootElements") {
          const targetIndex = targetPage.rootElements.findIndex(
            (item) => item.id === targetElementId
          );

          if (targetIndex === -1) return previousPages;

          targetPage.rootElements.splice(
            placement === "top" ? targetIndex : targetIndex + 1,
            0,
            draggedElement
          );

          return normalizeRows(updatedPages);
        }

        // Find the target row.
        const targetIndex = targetPage.rows.findIndex(
          (row) => row.id === targetRowId
        );

        if (targetIndex === -1) return previousPages;

        // Create a new row using the dragged element's collection.
        const newRow = {
          id: crypto.randomUUID(),

          fields:
            activeData.collection === "fields"
              ? [draggedElement]
              : [],

          elements:
            activeData.collection === "fields"
              ? []
              : [draggedElement],
        };

        targetPage.rows.splice(
          placement === "top" ? targetIndex : targetIndex + 1,
          0,
          newRow
        );

        return normalizeRows(updatedPages);
      }

      // CASE 3:
      // Drop to the left or right of another element.
      // Insert into the target element's row.
      if (placement === "left" || placement === "right") {
        // =========================================
        // FIX: HORIZONTAL DROP BESIDE ROOT ELEMENT
        //
        // Instead of keeping both elements in
        // rootElements, create a new row containing
        // both elements.
        // =========================================

        if (overData.targetCollection === "rootElements") {
          // Find the target root element.
          const targetIndex = targetPage.rootElements.findIndex(
            (item) => item.id === targetElementId
          );

          if (targetIndex === -1) return previousPages;

          // Get the target element before removing it.
          const targetElement = targetPage.rootElements[targetIndex];

          // Remove the target element from rootElements.
          targetPage.rootElements.splice(targetIndex, 1);

          // Create a new row containing both elements.
          // Root elements do not retain their original
          // fields/elements collection, so both are
          // placed in the elements collection.
          const newRow = {
            id: crypto.randomUUID(),
            fields: [],
            elements:
              placement === "left"
                ? [draggedElement, targetElement]
                : [targetElement, draggedElement],
          };

          // Add the new row to the page.
          targetPage.rows.push(newRow);

          // Normalize after the completed drop.
          return normalizeRows(updatedPages);
        }

        // Find the target row.
        const targetRow = targetPage.rows.find(
          (row) => row.id === targetRowId
        );

        if (!targetRow) return previousPages;

        const targetItems = targetRow[overData.targetCollection];

        if (!Array.isArray(targetItems)) return previousPages;

        const targetIndex = targetItems.findIndex(
          (item) => item.id === targetElementId
        );

        if (targetIndex === -1) return previousPages;

        targetItems.splice(
          placement === "left"
            ? targetIndex
            : targetIndex + 1,
          0,
          draggedElement
        );

        // IMPORTANT:
        // Normalize only AFTER inserting the dragged element.
        // This allows left/right drops within the same row to work.
        return normalizeRows(updatedPages);
      }

      return previousPages;
    });
  };

  // =========================================
  // PREVIEW COLLISION DETECTION
  // Preview drop zones take priority over the
  // large root drop area underneath them.
  // =========================================

  const previewCollisionDetection = (args) => {
    const collisions = pointerWithin(args);

    const edgeCollisions = collisions.filter(
      (collision) =>
        collision.data?.droppableContainer?.data.current?.type ===
        "previewDrop"
    );

    if (edgeCollisions.length > 0) {
      return edgeCollisions;
    }

    return collisions.filter(
      (collision) =>
        collision.data?.droppableContainer?.data.current?.type ===
        "rootDrop"
    );
  };

  // =========================================
  // MOVE ELEMENTS BETWEEN LOCATIONS
  // Handles dragging elements from ElementsPanel
  // into preview drop zones or another sidebar row.
  // =========================================

  const moveElementBetweenLocations = (activeData, overData) => {
    setPages((previousPages) => {
      let draggedElement = null;

      // First remove the element from its original location.
      let updatedPages = previousPages.map((page) => {
        if (page.id !== activeData.pageId) return page;

        const rows = (page.rows ?? []).map((row) => {
          const fields = [...(row.fields ?? [])];
          const elements = [...(row.elements ?? [])];

          // Remove a field from its original row.
          if (
            activeData.type === "field" &&
            row.id === activeData.rowId
          ) {
            const index = fields.findIndex(
              (item) => `field-${item.id}` === activeData.itemId
            );

            if (index !== -1) {
              draggedElement = fields[index];
              fields.splice(index, 1);
            }
          }

          // Remove a created element from its original row.
          if (
            activeData.type === "element" &&
            row.id === activeData.rowId
          ) {
            const index = elements.findIndex(
              (item) => `element-${item.id}` === activeData.itemId
            );

            if (index !== -1) {
              draggedElement = elements[index];
              elements.splice(index, 1);
            }
          }

          return { ...row, fields, elements };
        });

        // Handle elements outside rows.
        const rootElements = [...(page.rootElements ?? [])];

        if (activeData.type === "rootElement") {
          const index = rootElements.findIndex(
            (item) => `element-${item.id}` === activeData.itemId
          );

          if (index !== -1) {
            draggedElement = rootElements[index];
            rootElements.splice(index, 1);
          }
        }

        return {
          ...page,
          rows,
          rootElements,
        };
      });

      if (!draggedElement) return previousPages;

      // Find the destination page.
      const targetPageIndex = updatedPages.findIndex(
        (page) => page.id === overData.pageId
      );

      if (targetPageIndex === -1) return previousPages;

      const targetPage = updatedPages[targetPageIndex];
      const rows = [...(targetPage.rows ?? [])];
      const placement = overData.placement;

      // CASE 1:
      // Vertical drop: create a new full-width row.
      if (
        overData.type === "previewDrop" &&
        (placement === "top" || placement === "bottom")
      ) {
        const targetIndex = rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetIndex === -1) return previousPages;

        const newRow = {
          id: crypto.randomUUID(),

          fields:
            activeData.type === "field"
              ? [draggedElement]
              : [],

          elements:
            activeData.type === "field"
              ? []
              : [draggedElement],
        };

        rows.splice(
          placement === "top" ? targetIndex : targetIndex + 1,
          0,
          newRow
        );

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        return normalizeRows(updatedPages);
      }

      // CASE 2:
      // Horizontal drop of a root element.
      //
      // If the target is another root element,
      // move BOTH elements into one new row.
      // Otherwise, preserve the existing behavior
      // of placing the dragged root element into a row.
      if (
        activeData.type === "rootElement" &&
        overData.type === "previewDrop" &&
        (placement === "left" || placement === "right")
      ) {
        // =========================================
        // FIX: ROOT ELEMENT BESIDE ROOT ELEMENT
        // =========================================

        if (overData.targetCollection === "rootElements") {
          // Find the target root element.
          const targetIndex = (
            targetPage.rootElements ?? []
          ).findIndex(
            (item) => item.id === overData.targetElementId
          );

          if (targetIndex === -1) return previousPages;

          // Get the target root element.
          const targetElement = targetPage.rootElements[targetIndex];

          // Remove the target element from rootElements.
          const rootElements = [...(targetPage.rootElements ?? [])];
          rootElements.splice(targetIndex, 1);

          // Create one row containing both root elements.
          const newRow = {
            id: crypto.randomUUID(),
            fields: [],
            elements:
              placement === "left"
                ? [draggedElement, targetElement]
                : [targetElement, draggedElement],
          };

          // Add the new row and update the root elements.
          updatedPages[targetPageIndex] = {
            ...targetPage,
            rows: [...rows, newRow],
            rootElements,
          };

          return normalizeRows(updatedPages);
        }

        // Existing behavior:
        // If the target is inside a row, insert a separate
        // row above or below that target row.
        const targetIndex = rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetIndex === -1) return previousPages;

        rows.splice(
          targetIndex + (placement === "right" ? 1 : 0),
          0,
          {
            id: crypto.randomUUID(),
            fields: [],
            elements: [draggedElement],
          }
        );

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        return normalizeRows(updatedPages);
      }

      // CASE 3:
      // Horizontal drop into a target row.
      if (
        overData.type === "previewDrop" &&
        (placement === "left" || placement === "right")
      ) {
        const targetRowIndex = rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetRowIndex === -1) return previousPages;

        const targetRow = rows[targetRowIndex];

        // Use the target collection when provided.
        // This allows fields and created elements to share a row.
        const targetArray =
          overData.targetCollection === "fields" ||
            overData.targetCollection === "elements"
            ? overData.targetCollection
            : activeData.type === "field"
              ? "fields"
              : "elements";

        const items = [...(targetRow[targetArray] ?? [])];

        const targetIndex = items.findIndex(
          (item) => item.id === overData.targetElementId
        );

        if (targetIndex === -1) return previousPages;

        items.splice(
          targetIndex + (placement === "right" ? 1 : 0),
          0,
          draggedElement
        );

        rows[targetRowIndex] = {
          ...targetRow,
          [targetArray]: items,
        };

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        // Normalize after insertion, not before.
        return normalizeRows(updatedPages);
      }

      // CASE 4:
      // Drop into a row inside ElementsPanel.
      if (overData.type === "rowDrop") {
        const targetRowIndex = rows.findIndex(
          (row) => row.id === overData.rowId
        );

        if (targetRowIndex === -1) return previousPages;

        const targetRow = rows[targetRowIndex];

        const targetArray =
          activeData.type === "field" ? "fields" : "elements";

        rows[targetRowIndex] = {
          ...targetRow,

          [targetArray]: [
            ...(targetRow[targetArray] ?? []),
            draggedElement,
          ],
        };

        updatedPages[targetPageIndex] = {
          ...targetPage,
          rows,
        };

        return normalizeRows(updatedPages);
      }

      return previousPages;
    });
  };

  //active page id
  const activePageId = pages.find(
    (page) => page.open && page.visible !== false
  )?.id;
  // =========================================
  // EDITOR UI
  // =========================================

  return (
    <div className="template-editor">

      {/* Main content */}
      <div
        className={`template-editor__main ${collpase
          ? "template-editor__main--collapsed"
          : ["paragraph", "form_header", "form_footer"].includes(
            selectedElement?.type
          )
            ? "template-editor__main--paragraph"
            : "template-editor__main--expanded"
          }`}
      >

        {/* Sidebar */}
        <div
          className={`template-editor__sidebar ${collpase
            ? "template-editor__sidebar--collapsed"
            : ""
            }`}
        >
          <div className="template-editor__sidebar-options">
            <BlockStack gap="100">
              {sidebarOptions.map((option, index) => (
                <React.Fragment key={option.label}>
                  {index === 4 || index === 7 ? (
                    <Box paddingBlock="200">
                      <Divider />
                    </Box>
                  ) : null}

                  <Tooltip
                    content={option.label}
                    disabled={!collpase}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedOption(option.label)}
                      className={`template-editor__option ${selectedOption === option.label
                        ? "template-editor__option--selected"
                        : ""
                        } ${collpase
                          ? "template-editor__option--collapsed"
                          : ""
                        }`}
                      aria-label={option.label}
                    >
                      <span className="template-editor__option-icon">
                        <Icon source={option.icon} />
                      </span>

                      {!collpase && (
                        <span>{option.label}</span>
                      )}
                    </button>
                  </Tooltip>
                </React.Fragment>
              ))}
            </BlockStack>
          </div>

          {/* Collapse sidebar */}
          <div className="template-editor__collapse">
            <Divider />

            <Tooltip
              content={
                collpase
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              <Button
                fullWidth
                variant="tertiary"
                icon={MenuIcon}
                onClick={() => setCollapse((prev) => !prev)}
                accessibilityLabel={
                  collpase
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                }
              >
                {collpase ? "" : "Collapse Sidebar"}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Settings panel */}
        <div className="template-editor__settings">
          <div className="template-editor__settings-inner">
            {selectedElement ? (
              <ElementSettings
                element={selectedElement}
                pages={pages}
                onChange={updateSelectedElement}
                onDelete={() => handleDeleteElement(selectedElement)}
                onClose={() => setSelectedElement(null)}
                products={shopifyProducts}
                productsLoading={productsLoading}
                hasMoreProducts={productPageInfo.hasNextPage}
                productsLoadingMore={productsLoadingMore}
                onLoadMoreProducts={loadMoreProducts}
              />
            ) : (
              <Box paddingBlockStart="400">

                {/* Elements sidebar */}
                {selectedOption === "Elements" && (
                  <ElementsPanel
                    pages={pages}
                    setPages={setPages}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
                    //pass the popover states
                    elementPickerOpen={elementPickerOpen}
                    setElementPickerOpen={setElementPickerOpen}
                    elementTarget={elementTarget}
                    setElementTarget={setElementTarget}
                    elementPickerPosition={elementPickerPosition}
                    setElementPickerPosition={setElementPickerPosition}
                    openElementPicker={openElementPicker}
                    // NEW: Element toolbox actions
                    onToggleElementVisibility={handleToggleElementVisibility}
                    onDuplicateElement={handleDuplicateElement}
                    onDeleteElement={handleDeleteElement}
                    // NEW: Row toolbox actions
                    onToggleRowVisibility={handleToggleRowVisibility}
                    onDuplicateRow={handleDuplicateRow}
                    onDeleteRow={handleDeleteRow}
                    // NEW: Page toolbox actions
                    onDuplicatePage={handleDuplicatePage}
                    header={header}
                    footer={footer}
                    onSelectElement={setSelectedElement}
                  />
                )}

                {selectedOption === "Edit with AI" && (
                  <Text as="p">
                    Use AI to help build and customize your form.
                  </Text>
                )}

                {selectedOption === "Appearance" && (
                  <Text as="p">
                    Customize colors, fonts, and form styles here.
                  </Text>
                )}

                {selectedOption === "After submit" && (
                  <Text as="p">
                    Configure the message shown after submission.
                  </Text>
                )}

                {selectedOption === "Mail" && (
                  <Text as="p">
                    Configure email notifications here.
                  </Text>
                )}

                {selectedOption === "Integration" && (
                  <Text as="p">
                    Connect your form with other apps here.
                  </Text>
                )}

                {selectedOption === "Settings" && (
                  <Text as="p">
                    Configure general form settings here.
                  </Text>
                )}

                {selectedOption === "Translation" && (
                  <Text as="p">
                    Manage form translations here.
                  </Text>
                )}
              </Box>
            )}
          </div>
        </div>

        {/* Live preview */}

        <div className="template-editor__preview">

          {/* HEADER - OUTSIDE THE CARD */}
          <div className="live-preview__toolbar">
            {/* LEFT: Form title */}
            <div className="live-preview__toolbar-left">
              <InlineStack blockAlign="center" gap="200">
                <Text variant="bodyMd" fontWeight="semibold">
                  {templateTitle}
                </Text>

                <Badge tone="secondary">Draft</Badge>

                <Button
                  variant="plain"
                  icon={MenuHorizontalIcon}
                  accessibilityLabel="More options"
                />
              </InlineStack>
            </div>

            {/* CENTER: Language */}
            <div className="live-preview__toolbar-center">
              <Button
                variant="plain"
                disclosure="down"
                icon={LanguageIcon}
              >
                English
              </Button>
            </div>

            {/* RIGHT: Preview and history actions */}
            <div className="live-preview__toolbar-right">

              {/* MODE EDITOR / MODEL PREVIEW */}
              <Tooltip content={isModelPreview ? "Mode editor" : "Toggle model preview"}>
                <button
                  type="button"
                  className={`toolbar-icon-button ${isModelPreview ? "active" : ""}`}
                  onClick={() => setIsModelPreview((prev) => !prev)}
                  aria-label={isModelPreview ? "Mode editor" : "Toggle model preview"}
                >
                  <Icon source={CursorIcon} />
                </button>
              </Tooltip>

              {/* MOBILE PREVIEW */}
              <Tooltip content="Mobile preview">
                <button
                  type="button"
                  className={`toolbar-icon-button ${isMobilePreview ? "active" : ""}`}
                  onClick={() => setIsMobilePreview((prev) => !prev)}
                  aria-label="Mobile preview"
                >
                  <Icon source={MobileIcon} />
                </button>
              </Tooltip>

              {/* UNDO / REDO */}
              <ButtonGroup>
                <Button
                  icon={UndoIcon}
                  accessibilityLabel="Undo"
                />

                <Button
                  icon={RedoIcon}
                  accessibilityLabel="Redo"
                  disabled
                />
              </ButtonGroup>

            </div>
          </div>

          {/* <Card > */}
          <DndContext
            sensors={sensors}
            collisionDetection={previewCollisionDetection}
            onDragEnd={handlePreviewDragEnd}
          >
            <LivePreview
              pages={pages}
              activePageId={activePageId}
              header={header}
              footer={footer}
              templateTitle={templateTitle}
              formSettings={selectedTemplate}
              selectedElementId={selectedElement?.id}
              onSelectElement={setSelectedElement}
              onDuplicateElement={handleDuplicateElement}
              onToggleElementVisibility={handleToggleElementVisibility}
              onDeleteElement={handleDeleteElement}
              onOpenElementPicker={openElementPicker}
              onChangeElement={updateSelectedElement}
              products={shopifyProducts}
              productsLoading={productsLoading}
                isMobilePreview={isMobilePreview}
                 isModelPreview ={ isModelPreview}
            />
          </DndContext>
          {/* </Card> */}
        </div>

        {/* SHARED ELEMENT PICKER */}
        <ElementPickerPopover
          open={elementPickerOpen}
          columnsCount={elementPickerColumns}
          position={elementPickerPosition}
          onClose={() => {
            setElementPickerOpen(false);
            setElementTarget(null);
          }}
          onSelect={handleSelectElement}
        />
      </div>
    </div>
  );
}