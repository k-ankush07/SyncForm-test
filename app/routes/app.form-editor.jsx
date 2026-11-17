// =====================================================================
// FormEditor.jsx
//
// FLOW OVERVIEW
// ---------------------------------------------------------------------
// 1. The editor loads a template (from ?templateId=...) or a default page.
// 2. All form content lives in three shared states:
//      - pages  : every page, its rows, and its standalone rootElements
//      - header : the shared form header
//      - footer : the shared form footer
// 3. Three UI areas read/write those states:
//      - Sidebar            -> chooses which settings panel is shown
//      - Settings panel     -> ElementsPanel (structure) or ElementSettings
//      - LivePreview        -> visual preview with drag & drop
// 4. Every edit goes through a handler in this file (add / update / delete /
//    duplicate / move). Handlers always return NEW objects (no mutation).
// 5. A history effect records snapshots so Undo / Redo works.
//
// FILE ORDER
//   1. Imports
//   2. Constants (sidebar options, default header / footer / page)
//   3. Helper functions (normalizeRows, duplicate helpers)
//   4. FormEditor component
//        4.1 Template + core states
//        4.2 Shopify products (fetch + pagination)
//        4.3 Undo / Redo history + keyboard shortcuts
//        4.4 Element picker (open + add element)
//        4.5 Element / row / page actions
//        4.6 Drag & drop (sensors, ElementsPanel, LivePreview)
//        4.7 Render
// =====================================================================


// =====================================================================
// 1. IMPORTS
// =====================================================================

import React, { useState, useEffect, useRef } from "react";
import { useFetcher, useSearchParams } from "react-router";

// Shopify Polaris UI components
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
} from "@shopify/polaris";

// Shopify Polaris icons
import {
  MenuHorizontalIcon,
  LanguageIcon,
  CursorIcon,
  MobileIcon,
  UndoIcon,
  RedoIcon,
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

// Drag & drop
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

// Project components
import ElementsPanel from "../routes/components/ElementsPanel";
import LivePreview from "../routes/components/LivePreview";
import ElementSettings from "../routes/components/ElementSettings.jsx";
import ElementPickerPopover from "../routes/components/ElementPickerPopover.jsx";

// Project utilities / data
import { normalizeFormPages } from "../utils/normalizeFormPages.js";
import { createElementConfig } from "../utils/elementHelpers.js";
import { templates } from "../utils/templates.js";


// =====================================================================
// 2. CONSTANTS
// =====================================================================

// Left sidebar menu. A divider is drawn before index 4 and index 7.
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

// Default Header settings (used when the template has no header).
const defaultHeader = {
  id: 100,
  type: "form_header",
  label: "form_header",

  title: "Contact us",
  description: "Leave your message and we'll get back to you shortly.",

  showHeader: true,
  headingTag: "h2",
  alignment: "center",

  visible: true,
};

// Default Footer settings (used when the template has no footer).
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

// Default page used when no template is selected.
// A function is used so every call returns a fresh object.
const getDefaultPage = () => ({
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
});


// =====================================================================
// 3. HELPER FUNCTIONS
// =====================================================================

// ---------------------------------------------------------------------
// normalizeRows
//
// 1. Remove rows that contain no elements.
// 2. If a row contains only one element, move that element into
//    rootElements (remembering where it should appear).
// 3. Keep rows containing two or more elements.
//
// This keeps ElementsPanel and LivePreview synchronized through the
// shared pages state.
// ---------------------------------------------------------------------
const normalizeRows = (pages) =>
  pages.map((page) => {
    const originalRows = page.rows ?? [];
    const existingRootElements = [...(page.rootElements ?? [])];

    // Keep only rows that contain two or more elements.
    const updatedRows = originalRows.filter((row) => {
      const totalElements =
        (row.fields ?? []).length +
        (row.elements ?? []).length;

      return totalElements >= 2;
    });

    const convertedElements = [];

    originalRows.forEach((row, originalIndex) => {
      const fields = row.fields ?? [];
      const elements = row.elements ?? [];

      const totalElements = fields.length + elements.length;

      // CASE 1: Empty row. Nothing to convert.
      if (totalElements === 0) return;

      // CASE 2: Keep rows with two or more elements.
      if (totalElements >= 2) return;

      // CASE 3: Convert a single-element row into a root element.
      const remainingElement = fields[0] ?? elements[0];

      if (!remainingElement) return;

      // Find the next row that will remain after normalization.
      const nextRow = originalRows
        .slice(originalIndex + 1)
        .find(
          (candidate) =>
            (candidate.fields?.length ?? 0) +
            (candidate.elements?.length ?? 0) >= 2
        );

      // If there is no next row, find the previous surviving row.
      const previousRow = originalRows
        .slice(0, originalIndex)
        .reverse()
        .find(
          (candidate) =>
            (candidate.fields?.length ?? 0) +
            (candidate.elements?.length ?? 0) >= 2
        );

      // Remove any old position metadata before assigning its new position.
      const {
        insertBeforeRowId,
        insertAfterRowId,
        ...elementWithoutPosition
      } = remainingElement;

      const standaloneElement = {
        ...elementWithoutPosition,
      };

      if (nextRow) {
        // Keep the element immediately before the next surviving row.
        standaloneElement.insertBeforeRowId = nextRow.id;
      } else if (previousRow) {
        // If there is no next row, keep it immediately after the previous row.
        standaloneElement.insertAfterRowId = previousRow.id;
      }

      // Preserve the original order of converted elements.
      convertedElements.push(standaloneElement);
    });

    // Avoid adding an element twice.
    const existingIds = new Set(
      existingRootElements.map((element) => element.id)
    );

    const newConvertedElements = convertedElements.filter(
      (element) => !existingIds.has(element.id)
    );

    return {
      ...page,
      rows: updatedRows,

      // Converted elements are placed before ordinary bottom root elements.
      rootElements: [
        ...newConvertedElements,
        ...existingRootElements,
      ],
    };
  });

// ---------------------------------------------------------------------
// createDuplicateElement
// Duplicates an object-based element with a new ID and new option IDs.
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// createDuplicateRow
// Duplicates a row (new row ID + duplicated fields and elements).
// Fields can be plain strings (e.g. "Email"), so only objects are cloned.
// Used by both "duplicate row" and "duplicate page".
// ---------------------------------------------------------------------
const createDuplicateRow = (row) => ({
  ...row,
  id: crypto.randomUUID(),

  fields: (row.fields ?? []).map((field) =>
    typeof field === "object" && field !== null
      ? createDuplicateElement(field)
      : field
  ),

  elements: (row.elements ?? []).map(createDuplicateElement),
});

// ---------------------------------------------------------------------
// updateElementInPages
// Shared helper: finds an element by ID anywhere in the pages
// (row fields, row elements, rootElements) and replaces it with
// whatever the updater function returns.
// ---------------------------------------------------------------------
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


// =====================================================================
// 4. FORM EDITOR COMPONENT
// =====================================================================

export default function FormEditor() {
  // -------------------------------------------------------------------
  // 4.1 TEMPLATE + CORE STATES
  // -------------------------------------------------------------------

  const [searchParams] = useSearchParams();

  const templateId = searchParams.get("templateId");
  const templateTitle = searchParams.get("title") || "Form editor";

  const selectedTemplate = templates.find(
    (template) => String(template.id) === templateId
  );

  // Header and Footer from the selected template (if any).
  // Templates without them fall back to the defaults.
  const templateHeader = selectedTemplate?.pages?.find(
    (page) => page.header
  )?.header;

  const templateFooter = selectedTemplate?.pages?.find(
    (page) => page.footer
  )?.footer;

  // Preview toolbar toggles.
  const [isModelPreview, setIsModelPreview] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Sidebar state.
  const [selectedOption, setSelectedOption] = useState("Elements");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Element currently opened in the settings panel.
  const [selectedElement, setSelectedElement] = useState(null);
  

  // Element picker popover state.
  const [elementPickerOpen, setElementPickerOpen] = useState(false);
  const [elementTarget, setElementTarget] = useState(null);
  const [elementPickerColumns, setElementPickerColumns] = useState(4);
  const [elementPickerPosition, setElementPickerPosition] = useState({
    top: 150,
    left: 490,
  });

  // Shared Header state.
  // Template settings override defaults; missing properties use defaultHeader.
  const [header, setHeader] = useState(() => ({
    ...defaultHeader,
    ...(templateHeader ?? {}),
  }));

  // Shared Footer state.
  // Existing template settings are preserved; missing ones use defaults.
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

  // Pages state. Header/footer are shared, so they are removed
  // from each page.
  const [pages, setPages] = useState(() =>
    normalizeFormPages(
      selectedTemplate?.pages ?? [getDefaultPage()]
    ).map(({ header, footer, ...page }) => page)
  );

  // The page currently open (visible) in the preview.
  const activePageId = pages.find(
    (page) => page.open && page.visible !== false
  )?.id;


  // -------------------------------------------------------------------
  // 4.2 SHOPIFY PRODUCTS (fetch + pagination)
  // -------------------------------------------------------------------

  const productFetcher = useFetcher();

  const [shopifyProducts, setShopifyProducts] = useState([]);

  const [productPageInfo, setProductPageInfo] = useState({
    hasNextPage: false,
    endCursor: null,
  });

  // True when the next response should be appended to the list
  // (set by "Load more"), false when it should replace the list.
  const appendProductsRef = useRef(false);

  // Fetch the first 5 products on mount.
  useEffect(() => {
    if (productFetcher.state === "idle" && !productFetcher.data) {
      productFetcher.load("/app/products");
    }
  }, []);

  // Receive products from Shopify.
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

  // Fetch the next 5 products ONLY when "Load more" is clicked.
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

  // Loading states.
  const productsLoading =
    productFetcher.state === "loading" &&
    shopifyProducts.length === 0;

  const productsLoadingMore =
    productFetcher.state === "loading" &&
    shopifyProducts.length > 0;


  // -------------------------------------------------------------------
  // 4.3 UNDO / REDO HISTORY + KEYBOARD SHORTCUTS
  // Tracks changes to pages, header and footer.
  // -------------------------------------------------------------------

  const historyRef = useRef({
    past: [],
    present: null,
    future: [],
    lastChangeAt: 0,
  });

  const [historyStatus, setHistoryStatus] = useState({
    canUndo: false,
    canRedo: false,
  });

  const updateHistoryStatus = () => {
    setHistoryStatus({
      canUndo: historyRef.current.past.length > 0,
      canRedo: historyRef.current.future.length > 0,
    });
  };

  // Create an independent snapshot of the form data.
  const createFormSnapshot = () =>
    structuredClone({
      pages,
      header,
      footer,
    });

  // Automatically record form changes.
  useEffect(() => {
    const nextSnapshot = createFormSnapshot();
    const history = historyRef.current;

    // Save the initial form state.
    if (!history.present) {
      history.present = nextSnapshot;
      updateHistoryStatus();
      return;
    }

    // Ignore unchanged data.
    if (
      JSON.stringify(nextSnapshot) ===
      JSON.stringify(history.present)
    ) {
      return;
    }

    const now = Date.now();

    // Group rapid changes (e.g. typing) into one undo step.
    const isSameEditingGroup =
      now - history.lastChangeAt < 500;

    if (!isSameEditingGroup) {
      history.past.push(history.present);

      // Keep a maximum of 50 undo steps.
      if (history.past.length > 50) {
        history.past.shift();
      }
    }

    history.present = nextSnapshot;
    history.future = [];
    history.lastChangeAt = now;

    updateHistoryStatus();
  }, [pages, header, footer]);

  // UNDO
  const handleUndo = () => {
    const history = historyRef.current;

    if (history.past.length === 0) return;

    const previousSnapshot = history.past.pop();

    // Save the current state for Redo.
    history.future.unshift(
      structuredClone(history.present)
    );

    history.present = previousSnapshot;
    history.lastChangeAt = 0;

    // Restore the form data.
    setPages(previousSnapshot.pages);
    setHeader(previousSnapshot.header);
    setFooter(previousSnapshot.footer);

    // Clear selection because it may refer to an old element version.
    setSelectedElement(null);

    updateHistoryStatus();
  };

  // REDO
  const handleRedo = () => {
    const history = historyRef.current;

    if (history.future.length === 0) return;

    const nextSnapshot = history.future.shift();

    // Save the current state for Undo.
    history.past.push(
      structuredClone(history.present)
    );

    history.present = nextSnapshot;
    history.lastChangeAt = 0;

    // Restore the form data.
    setPages(nextSnapshot.pages);
    setHeader(nextSnapshot.header);
    setFooter(nextSnapshot.footer);

    setSelectedElement(null);

    updateHistoryStatus();
  };

  // Keyboard shortcuts:
  //   Ctrl/Cmd + Z          = Undo
  //   Ctrl/Cmd + Shift + Z  = Redo
  //   Ctrl/Cmd + Y          = Redo
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMac = navigator.platform
        .toUpperCase()
        .includes("MAC");

      const modifierPressed = isMac
        ? event.metaKey
        : event.ctrlKey;

      if (!modifierPressed) return;

      // Preserve native undo/redo while editing text.
      const target = event.target;

      const isEditingText =
        target instanceof HTMLElement &&
        (
          target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(
            target.tagName
          )
        );

      if (isEditingText) return;

      // Undo: Ctrl/Cmd + Z
      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl/Cmd + Shift + Z
      else if (
        event.key.toLowerCase() === "z" &&
        event.shiftKey
      ) {
        event.preventDefault();
        handleRedo();
      }

      // Redo: Ctrl/Cmd + Y
      else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);


  // -------------------------------------------------------------------
  // 4.4 ELEMENT PICKER (open + add element)
  // -------------------------------------------------------------------

  // Opens the same picker from ElementsPanel (sidebar) or LivePreview.
  //   Sidebar call : (pageId, rowId, event, extraTarget)
  //   Preview call : (targetObject, event)
  const openElementPicker = (
    targetOrPageId,
    rowIdOrEvent = null,
    maybeEvent,
    extraTarget = {}
  ) => {
    const isPreviewTarget =
      typeof targetOrPageId === "object" && targetOrPageId !== null;

    // Preview uses a narrower picker (2 columns), sidebar uses 4.
    setElementPickerColumns(isPreviewTarget ? 2 : 4);

    const target = isPreviewTarget
      ? targetOrPageId
      : {
        pageId: targetOrPageId,
        rowId: rowIdOrEvent ?? null,
        ...extraTarget,
      };

    const event = isPreviewTarget ? rowIdOrEvent : maybeEvent;

    // Default popover position.
    let top = 150;
    let left = 490;

    // Position the popover next to the clicked button.
    if (event?.currentTarget) {
      const buttonRect = event.currentTarget.getBoundingClientRect();

      const modalWidth = isPreviewTarget
        ? Math.min(480, window.innerWidth - 16)
        : Math.min(800, window.innerWidth - 16);

      const modalHeight = Math.min(430, window.innerHeight - 24);

      left = buttonRect.right + 8;

      // Flip to the left side if there is no room on the right.
      if (left + modalWidth > window.innerWidth - 12) {
        left = buttonRect.left - modalWidth - 8;
      }

      // Keep the popover inside the viewport.
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

  // Adds the picked element at the requested position
  // (or appends it when added from the sidebar).
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
          referenceElementId,
        } = elementTarget;

        // CASE 0: INSERT A STANDALONE ELEMENT BETWEEN ROWS
        // Used by the plus button in LivePreview.
        if (
          collection === "rows" &&
          rowId != null &&
          (placement === "before" || placement === "after")
        ) {
          // Keep the new element outside the rows array.
          const standaloneElement = {
            ...newElement,

            // Remember which row this element belongs beside.
            ...(placement === "before"
              ? { insertBeforeRowId: rowId }
              : { insertAfterRowId: rowId }),
          };

          return {
            ...page,
            rootElements: [
              ...(page.rootElements || []),
              standaloneElement,
            ],
          };
        }

        // CASE 0.5: INSERT BETWEEN STANDALONE ELEMENTS
        if (
          collection === "rootElements" &&
          referenceElementId != null &&
          (placement === "before" || placement === "after")
        ) {
          const rootElements = [...(page.rootElements || [])];

          const targetIndex = rootElements.findIndex(
            (element) => element.id === referenceElementId
          );

          if (targetIndex === -1) return page;

          // Insert before or after the selected standalone element.
          const insertAt =
            placement === "before"
              ? targetIndex
              : targetIndex + 1;

          rootElements.splice(insertAt, 0, newElement);

          return {
            ...page,
            rootElements,
          };
        }

        // CASE 1: PREVIEW INSERTION INTO A ROW
        // Insert before or after the selected element.
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

        // CASE 2: PREVIEW INSERTION BESIDE A ROOT ELEMENT
        // Convert the target and the new element into a row.
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

        // CASE 3: PREVIEW INSERTION ABOVE OR BELOW A ROOT ELEMENT
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

        // CASE 4: SIDEBAR ADD ELEMENT INTO A ROW (append to the row)
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

        // CASE 5: SIDEBAR INSERTION AT A SPECIFIC POSITION
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

        // CASE 6: NORMAL SIDEBAR ADD ELEMENT (append to rootElements)
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


  // -------------------------------------------------------------------
  // 4.5 ELEMENT / ROW / PAGE ACTIONS
  // -------------------------------------------------------------------

  // UPDATE SELECTED ELEMENT (used by ElementSettings)
  // Header and footer update their shared state.
  // Normal elements update inside pages.
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
      updateElementInPages(
        previousPages,
        updatedElement.id,
        () => updatedElement
      )
    );

    setSelectedElement(updatedElement);
  };

  // SHOW OR HIDE ELEMENT
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
  };

  // DELETE ELEMENT
  // After deleting:
  //  - Empty rows are removed.
  //  - Rows with one remaining element become root elements.
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

  // DUPLICATE ELEMENT
  // Inserts the duplicate immediately after the original element.
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

    // Returns a copy of `items` with the duplicate placed after the original.
    const insertAfterOriginal = (items) => {
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

    setPages((previousPages) =>
      previousPages.map((page) => ({
        ...page,

        rows: (page.rows ?? []).map((row) => ({
          ...row,
          fields: insertAfterOriginal(row.fields ?? []),
          elements: insertAfterOriginal(row.elements ?? []),
        })),

        rootElements: insertAfterOriginal(page.rootElements ?? []),
      }))
    );
  };

  // SHOW OR HIDE ROW
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

  // DUPLICATE ROW (inserted right after the original row)
  const handleDuplicateRow = (pageId, rowId) => {
    setPages((previousPages) =>
      previousPages.map((page) => {
        if (page.id !== pageId) return page;

        const rowIndex = (page.rows ?? []).findIndex(
          (row) => row.id === rowId
        );

        if (rowIndex === -1) return page;

        const duplicateRow = createDuplicateRow(page.rows[rowIndex]);

        const updatedRows = [...page.rows];

        updatedRows.splice(rowIndex + 1, 0, duplicateRow);

        return {
          ...page,
          rows: updatedRows,
        };
      })
    );
  };

  // DELETE ROW
  const handleDeleteRow = (pageId, rowId) => {
    // Collect the IDs of elements inside the row so the selection
    // can be cleared if the selected element is being deleted.
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

  // DUPLICATE PAGE (page + all its rows and elements)
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

        rows: (originalPage.rows ?? []).map(createDuplicateRow),

        rootElements: (originalPage.rootElements ?? []).map(
          createDuplicateElement
        ),

        submitButton: originalPage.submitButton
          ? { ...originalPage.submitButton }
          : originalPage.submitButton,
      };

      // Close all pages, then insert the (open) duplicate after the original.
      const updatedPages = previousPages.map((page) => ({
        ...page,
        open: false,
      }));

      updatedPages.splice(pageIndex + 1, 0, duplicatePage);

      return updatedPages;
    });

    setSelectedElement(null);
  };


  // -------------------------------------------------------------------
  // 4.6 DRAG AND DROP
  // -------------------------------------------------------------------

  // Sensors: a drag starts only after the pointer moves 5px.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // MOVE ELEMENTS BETWEEN LOCATIONS
  // Handles dragging elements from ElementsPanel into preview drop zones
  // or into another sidebar row.
  const moveElementBetweenLocations = (activeData, overData) => {
    setPages((previousPages) => {
      let draggedElement = null;

      // Step 1: remove the element from its original location.
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

        // Remove an element that lives outside rows.
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

      // Step 2: find the destination page.
      const targetPageIndex = updatedPages.findIndex(
        (page) => page.id === overData.pageId
      );

      if (targetPageIndex === -1) return previousPages;

      const targetPage = updatedPages[targetPageIndex];
      const rows = [...(targetPage.rows ?? [])];
      const placement = overData.placement;

      // CASE 1: Vertical drop -> create a new full-width row.
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

      // CASE 2: Horizontal drop of a ROOT element.
      // If the target is another root element, move BOTH elements into
      // one new row. Otherwise place the dragged root element into its
      // own row beside the target row.
      if (
        activeData.type === "rootElement" &&
        overData.type === "previewDrop" &&
        (placement === "left" || placement === "right")
      ) {
        // Root element beside root element -> one new row with both.
        if (overData.targetCollection === "rootElements") {
          const targetIndex = (
            targetPage.rootElements ?? []
          ).findIndex(
            (item) => item.id === overData.targetElementId
          );

          if (targetIndex === -1) return previousPages;

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

          updatedPages[targetPageIndex] = {
            ...targetPage,
            rows: [...rows, newRow],
            rootElements,
          };

          return normalizeRows(updatedPages);
        }

        // Target is inside a row -> insert a separate row above/below it.
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

      // CASE 3: Horizontal drop into a target row.
      if (
        overData.type === "previewDrop" &&
        (placement === "left" || placement === "right")
      ) {
        const targetRowIndex = rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetRowIndex === -1) return previousPages;

        const targetRow = rows[targetRowIndex];

        // Use the target collection when provided so fields and
        // created elements can share a row.
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

      // CASE 4: Drop into a row inside ElementsPanel.
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

  // ELEMENTS PANEL DRAG END
  // Handles page sorting, row sorting and moving sidebar elements.
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

    // Reorder rows (within the same page only).
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

  // PREVIEW DRAG END
  // Separate from the ElementsPanel drag handler. Moves an element that
  // is dragged inside LivePreview.
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

      // CASE 0: DROP BETWEEN TWO ROWS
      // The element stays standalone and remembers its position.
      if (overData.type === "previewRowInsert") {
        const targetIndex = targetPage.rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (targetIndex === -1) return previousPages;

        // Remove any empty source rows left after dragging.
        // Keep the target row because it is our insertion anchor.
        targetPage.rows = targetPage.rows.filter(
          (row) =>
            row.id === overData.targetRowId ||
            (row.fields?.length ?? 0) > 0 ||
            (row.elements?.length ?? 0) > 0
        );

        // Make sure the target row still exists.
        const updatedTargetIndex = targetPage.rows.findIndex(
          (row) => row.id === overData.targetRowId
        );

        if (updatedTargetIndex === -1) return previousPages;

        // Remove any old standalone positioning metadata.
        const {
          insertBeforeRowId,
          insertAfterRowId,
          ...elementWithoutPosition
        } = draggedElement;

        // Keep the element standalone and remember its position.
        const standaloneElement = {
          ...elementWithoutPosition,
          ...(overData.placement === "before"
            ? { insertBeforeRowId: overData.targetRowId }
            : { insertAfterRowId: overData.targetRowId }),
        };

        targetPage.rootElements = targetPage.rootElements || [];
        targetPage.rootElements.push(standaloneElement);

        return updatedPages;
      }

      // CASE 1: Drop outside a row.
      // Move the element into rootElements (full width).
      if (overData.type === "rootDrop") {
        targetPage.rootElements.push(draggedElement);

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

      // CASE 2: Drop above or below another element.
      // Creates a new full-width row (or reorders rootElements).
      if (placement === "top" || placement === "bottom") {
        // If the target is a root element, insert into rootElements.
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

      // CASE 3: Drop to the left or right of another element.
      if (placement === "left" || placement === "right") {
        // Beside a ROOT element: create a new row containing both
        // elements (root elements don't keep a fields/elements
        // collection, so both go into `elements`).
        if (overData.targetCollection === "rootElements") {
          const targetIndex = targetPage.rootElements.findIndex(
            (item) => item.id === targetElementId
          );

          if (targetIndex === -1) return previousPages;

          // Get the target element before removing it.
          const targetElement = targetPage.rootElements[targetIndex];

          // Remove the target element from rootElements.
          targetPage.rootElements.splice(targetIndex, 1);

          const newRow = {
            id: crypto.randomUUID(),
            fields: [],
            elements:
              placement === "left"
                ? [draggedElement, targetElement]
                : [targetElement, draggedElement],
          };

          targetPage.rows.push(newRow);

          return normalizeRows(updatedPages);
        }

        // Beside an element inside a row: insert into that row.
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

        // IMPORTANT: normalize only AFTER inserting the dragged element.
        // This allows left/right drops within the same row to work.
        return normalizeRows(updatedPages);
      }

      return previousPages;
    });
  };

  // PREVIEW COLLISION DETECTION
  // Preview drop zones take priority over the large root drop area
  // underneath them.
  const previewCollisionDetection = (args) => {
    const collisions = pointerWithin(args);

    const getType = (collision) =>
      collision.data?.droppableContainer?.data.current?.type;

    // Priority 1: Drop between rows.
    const rowInsertCollisions = collisions.filter(
      (collision) => getType(collision) === "previewRowInsert"
    );

    if (rowInsertCollisions.length > 0) {
      return rowInsertCollisions;
    }

    // Priority 2: Drop around individual elements.
    const edgeCollisions = collisions.filter(
      (collision) => getType(collision) === "previewDrop"
    );

    if (edgeCollisions.length > 0) {
      return edgeCollisions;
    }

    // Priority 3: Drop into the general preview area.
    return collisions.filter(
      (collision) => getType(collision) === "rootDrop"
    );
  };


  // -------------------------------------------------------------------
  // 4.7 RENDER
  // Layout: [ Sidebar ] [ Settings panel ] [ Live preview ]
  // -------------------------------------------------------------------

  return (
    <div className="template-editor">

      {/* Main content */}
      <div
        className={`template-editor__main ${isSidebarCollapsed
          ? "template-editor__main--collapsed"
          : ["paragraph", "form_header", "form_footer"].includes(
            selectedElement?.type
          )
            ? "template-editor__main--paragraph"
            : "template-editor__main--expanded"
          }`}
      >

        {/* ---------------------------------------------------------- */}
        {/* SIDEBAR                                                    */}
        {/* ---------------------------------------------------------- */}
        <div
          className={`template-editor__sidebar ${isSidebarCollapsed
            ? "template-editor__sidebar--collapsed"
            : ""
            }`}
        >
          <div className="template-editor__sidebar-options">
            <BlockStack gap="100">
              {sidebarOptions.map((option, index) => (
                <React.Fragment key={option.label}>
                  {/* Divider before "Mail" and "Translation" */}
                  {index === 4 || index === 7 ? (
                    <Box paddingBlock="200">
                      <Divider />
                    </Box>
                  ) : null}

                  <Tooltip
                    content={option.label}
                    disabled={!isSidebarCollapsed}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedOption(option.label)}
                      className={`template-editor__option ${selectedOption === option.label
                        ? "template-editor__option--selected"
                        : ""
                        } ${isSidebarCollapsed
                          ? "template-editor__option--collapsed"
                          : ""
                        }`}
                      aria-label={option.label}
                    >
                      <span className="template-editor__option-icon">
                        <Icon source={option.icon} />
                      </span>

                      {!isSidebarCollapsed && (
                        <span>{option.label}</span>
                      )}
                    </button>
                  </Tooltip>
                </React.Fragment>
              ))}
            </BlockStack>
          </div>

          {/* Collapse / expand sidebar */}
          <div className="template-editor__collapse">
            <Divider />

            <Tooltip
              content={
                isSidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              <Button
                fullWidth
                variant="tertiary"
                icon={MenuIcon}
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                accessibilityLabel={
                  isSidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? "" : "Collapse Sidebar"}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* SETTINGS PANEL                                             */}
        {/* Shows ElementSettings when an element is selected,         */}
        {/* otherwise the panel for the chosen sidebar option.         */}
        {/* ---------------------------------------------------------- */}
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

                {/* Elements panel */}
                {selectedOption === "Elements" && (
                  <ElementsPanel
                    pages={pages}
                    setPages={setPages}
                    sensors={sensors}
                    handleDragEnd={handleDragEnd}
                    // Element picker popover
                    elementPickerOpen={elementPickerOpen}
                    setElementPickerOpen={setElementPickerOpen}
                    elementTarget={elementTarget}
                    setElementTarget={setElementTarget}
                    elementPickerPosition={elementPickerPosition}
                    setElementPickerPosition={setElementPickerPosition}
                    openElementPicker={openElementPicker}
                    // Element toolbox actions
                    onToggleElementVisibility={handleToggleElementVisibility}
                    onDuplicateElement={handleDuplicateElement}
                    onDeleteElement={handleDeleteElement}
                    // Row toolbox actions
                    onToggleRowVisibility={handleToggleRowVisibility}
                    onDuplicateRow={handleDuplicateRow}
                    onDeleteRow={handleDeleteRow}
                    // Page toolbox actions
                    onDuplicatePage={handleDuplicatePage}
                    header={header}
                    footer={footer}
                    onSelectElement={setSelectedElement}
                  />
                )}

                {/* Placeholder panels for the other sidebar options */}
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

        {/* ---------------------------------------------------------- */}
        {/* LIVE PREVIEW                                               */}
        {/* ---------------------------------------------------------- */}
        <div className="template-editor__preview">

          {/* Toolbar (outside the preview card) */}
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

            {/* RIGHT: Preview toggles and undo / redo */}
            <div className="live-preview__toolbar-right">

              {/* Editor mode / model preview toggle */}
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

              {/* Mobile preview toggle */}
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

              {/* Undo / Redo */}
              <ButtonGroup>
                <Tooltip content="Undo (Ctrl + Z)">
                  <Button
                    icon={UndoIcon}
                    accessibilityLabel="Undo"
                    onClick={handleUndo}
                    disabled={!historyStatus.canUndo}
                  />
                </Tooltip>

                <Tooltip content="Redo (Ctrl + Shift + Z)">
                  <Button
                    icon={RedoIcon}
                    accessibilityLabel="Redo"
                    onClick={handleRedo}
                    disabled={!historyStatus.canRedo}
                  />
                </Tooltip>
              </ButtonGroup>

            </div>
          </div>

          {/* Preview with its own drag & drop context */}
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
              isModelPreview={isModelPreview}
            />
          </DndContext>
        </div>

        {/* Shared element picker (used by both the sidebar and the preview) */}
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