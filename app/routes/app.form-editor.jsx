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
   FileIcon,
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
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

// Project components
import ElementsPanel from "../routes/components/ElementsPanel";
import LivePreview from "../routes/components/LivePreview";
import ElementSettings from "../routes/components/ElementSettings.jsx";
import ElementPickerPopover from "../routes/components/ElementPickerPopover.jsx";
import PageSettings from '../routes/components/elementsettings/groups/PageSettings.jsx'
import RowSettings from '../routes/components/elementsettings/groups/RowSettings.jsx';

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

    const updatedRows = [];
    const convertedElements = [];

    // STEP 1: Keep rows containing at least two items.
    originalRows.forEach((row) => {
      const totalItems =
        (row.fields ?? []).length +
        (row.elements ?? []).length;

      if (totalItems >= 2) {
        updatedRows.push(row);
      }
    });

    // These are the only rows that will remain after normalization.
    const survivingRowIds = new Set(
      updatedRows.map((row) => String(row.id))
    );

    // STEP 2: Find the nearest surviving row around a removed row.
    const getPositionForRow = (rowId) => {
      const index = originalRows.findIndex(
        (row) => String(row.id) === String(rowId)
      );

      if (index === -1) return {};

      // Prefer the next surviving row.
      const nextRow = originalRows
        .slice(index + 1)
        .find((row) =>
          survivingRowIds.has(String(row.id))
        );

      if (nextRow) {
        return {
          insertBeforeRowId: nextRow.id,
          insertAfterRowId: undefined,
        };
      }

      // Otherwise, use the previous surviving row.
      const previousRow = originalRows
        .slice(0, index)
        .reverse()
        .find((row) =>
          survivingRowIds.has(String(row.id))
        );

      if (previousRow) {
        return {
          insertBeforeRowId: undefined,
          insertAfterRowId: previousRow.id,
        };
      }

      // No surviving rows: this element becomes unanchored.
      return {
        insertBeforeRowId: undefined,
        insertAfterRowId: undefined,
      };
    };

    // STEP 3: Convert every singleton row into a standalone element.
    originalRows.forEach((row) => {
      const allItems = [
        ...(row.fields ?? []),
        ...(row.elements ?? []),
      ];

      if (allItems.length !== 1) return;

      convertedElements.push({
        ...allItems[0],
        ...getPositionForRow(row.id),
      });
    });

    // STEP 4: Repair existing standalone elements.
    const repairedRootElements = existingRootElements.map(
      (element) => {
        const beforeId = element.insertBeforeRowId;
        const afterId = element.insertAfterRowId;

        // No anchor: preserve the standalone element as it is.
        if (!beforeId && !afterId) {
          return element;
        }

        // A valid before anchor takes priority.
        if (
          beforeId &&
          survivingRowIds.has(String(beforeId))
        ) {
          return {
            ...element,
            insertBeforeRowId: beforeId,
            insertAfterRowId: undefined,
          };
        }

        // A valid after anchor takes priority if before is invalid.
        if (
          afterId &&
          survivingRowIds.has(String(afterId))
        ) {
          return {
            ...element,
            insertBeforeRowId: undefined,
            insertAfterRowId: afterId,
          };
        }

        // Both anchors are invalid, or the only anchor is invalid.
        const removedRowId = beforeId || afterId;

        return {
          ...element,
          insertBeforeRowId: undefined,
          insertAfterRowId: undefined,
          ...getPositionForRow(removedRowId),
        };
      }
    );

    // STEP 5: Return normalized page.
    return {
      ...page,
      rows: updatedRows,
      rootElements: [
        ...repairedRootElements,
        ...convertedElements,
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
  // This tells the editor whether the selected header or footer belongs to a particular page.
  const [selectedElementPageId, setSelectedElementPageId] = useState(null);

  // This state is for selecting pages and rows.
  const [selectedTarget, setSelectedTarget] = useState(null);

  // Drag & Drop show 
  const [activeDragItemLive, setActiveDragItemLive] = useState(null);

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
  // Pages state. Header/footer are shared by default.
  // A page only stores its own header/footer when custom mode is used.
  const [pages, setPages] = useState(() =>
    normalizeFormPages(
      selectedTemplate?.pages ?? [getDefaultPage()]
    ).map((page) => ({
      ...page,

      // Decide whether this page uses its own header/footer.
      useCustomHeader: page.useCustomHeader ?? false,
      useCustomFooter: page.useCustomFooter ?? false,

      // Preserve existing custom settings without creating unnecessary
      // page-specific copies for pages using the shared defaults.
      ...(page.header ? {
        header: {
          ...defaultHeader,
          ...page.header,
        },
      } : {}),

      ...(page.footer ? {
        footer: {
          ...defaultFooter,
          ...page.footer,
        },
      } : {}),
    }))
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

  //
  // ======================================================
  // FIND SELECTED PAGE AND ROW
  // ======================================================

  // Get the latest selected page from pages state.
  const selectedPage = pages.find(
    (page) =>
      String(page.id) === String(selectedTarget?.pageId)
  );

  // Get the selected row from that page.
  const selectedRow = selectedPage?.rows?.find(
    (row) =>
      String(row.id) === String(selectedTarget?.rowId)
  );

  // ======================================================
  // UPDATE SELECTED PAGE
  // ======================================================

  const updateSelectedPage = (updates) => {
    setPages((previousPages) =>
      previousPages.map((page) => {
        // Only update the page currently selected in PageSettings.
        if (String(page.id) !== String(selectedTarget?.pageId)) {
          return page;
        }

        const updatedPage = {
          ...page,
          ...updates,
        };

        // ---------------------------------------------------
        // CASE 1: Enable custom header for this page.
        // Create an independent copy of the shared header.
        // Preserve an existing custom header when switching
        // custom mode off and on again.
        // ---------------------------------------------------
        if (
          updates.useCustomHeader === true &&
          page.useCustomHeader !== true
        ) {
          updatedPage.header = page.header
            ? { ...page.header }
            : {
              ...header,
              id: `custom-header-${page.id}`,
            };
        }

        // ---------------------------------------------------
        // CASE 2: Enable custom footer for this page.
        // Create an independent copy of the shared footer.
        // Preserve an existing custom footer when switching
        // custom mode off and on again.
        // ---------------------------------------------------
        if (
          updates.useCustomFooter === true &&
          page.useCustomFooter !== true
        ) {
          updatedPage.footer = page.footer
            ? { ...page.footer }
            : {
              ...footer,
              id: `custom-footer-${page.id}`,
            };
        }

        return updatedPage;
      })
    );
  };
  // ======================================================
  // UPDATE SELECTED ROW
  // ======================================================

  const updateSelectedRow = (updates) => {
    setPages((previousPages) =>
      previousPages.map((page) =>
        String(page.id) === String(selectedTarget?.pageId)
          ? {
            ...page,
            rows: (page.rows || []).map((row) =>
              String(row.id) === String(selectedTarget?.rowId)
                ? {
                  ...row,
                  ...updates,
                }
                : row
            ),
          }
          : page
      )
    );
  };

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

  // Select a page.
  const handleSelectPage = (page) => {
    setSelectedElement(null);

    setSelectedTarget({
      type: "page",
      pageId: page.id,
    });
  };

  // Select a row.
  const handleSelectRow = (pageId, row) => {
    setSelectedElement(null);

    setSelectedTarget({
      type: "row",
      pageId,
      rowId: row.id,
    });
  };
  // ======================================================
  // SELECT AN EXISTING ELEMENT
  // Used when clicking First Name, Email, Phone, headers,
  // footers, and other elements in the preview.
  // ======================================================

  const handleSelectExistingElement = (element, pageId = null) => {
    const isHeader = element?.type === "form_header";
    const isFooter = element?.type === "form_footer";

    // Find the page that owns this custom header/footer.
    const matchingCustomPage = pages.find((page) => {
      if (isHeader) {
        return (
          page.useCustomHeader === true &&
          String(page.header?.id) === String(element?.id)
        );
      }

      if (isFooter) {
        return (
          page.useCustomFooter === true &&
          String(page.footer?.id) === String(element?.id)
        );
      }

      return false;
    });

    // A page ID is used only for a custom header/footer.
    // Shared header/footer always use null.
    const resolvedPageId =
      pageId ?? matchingCustomPage?.id ?? null;

    console.log("HEADER/FOOTER SELECTION:", {
      elementId: element?.id,
      elementType: element?.type,
      receivedPageId: pageId,
      resolvedPageId,
      isShared: resolvedPageId === null,
    });

    setSelectedElement(element);
    setSelectedElementPageId(resolvedPageId);
    setSelectedTarget(null);
  };
  // Adds the picked element at the requested position
  // (or appends it when added from the sidebar).
  const handleSelectElement = (item) => {
    if (!elementTarget || !item?.type) return;

    const newElement = createElementConfig(item);
    console.log("NEW ELEMENT CREATED:", {
      id: newElement.id,
      type: newElement.type,
      element: newElement,
    });

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
            (element) => String(element.id) === String(referenceElementId)
          );

          if (targetIndex === -1) return page;

          const targetElement = rootElements[targetIndex];

          // Preserve the target's position relative to its row.
          const standaloneElement = {
            ...newElement,
            ...(targetElement.insertBeforeRowId != null
              ? { insertBeforeRowId: targetElement.insertBeforeRowId }
              : {}),
            ...(targetElement.insertAfterRowId != null
              ? { insertAfterRowId: targetElement.insertAfterRowId }
              : {}),
          };

          const insertAt =
            placement === "before" ? targetIndex : targetIndex + 1;

          rootElements.splice(insertAt, 0, standaloneElement);

          return {
            ...page,
            rootElements,
          };
        }

        // CASE 1: INSERT INTO A ROW AT THE EXACT SELECTED POSITION
        if (rowId != null && elementId != null) {
          return {
            ...page,

            rows: (page.rows || []).map((row) => {
              if (String(row.id) !== String(rowId)) return row;

              const targetCollection =
                collection === "fields" ? "fields" : "elements";

              const items = [...(row[targetCollection] || [])];

              const targetIndex = items.findIndex(
                (element) => String(element.id) === String(elementId)
              );

              if (targetIndex === -1) return row;

              const insertIndex =
                placement === "before"
                  ? targetIndex
                  : targetIndex + 1;

              items.splice(insertIndex, 0, newElement);

              return {
                ...row,
                [targetCollection]: items,
              };
            }),
          };
        }




        // CASE 2: PREVIEW INSERTION BESIDE A ROOT ELEMENT
        // Convert the target and new element into a row
        // while preserving its exact visual position.
        if (
          rowId == null &&
          elementId != null &&
          (placement === "left" || placement === "right")
        ) {
          const originalRootElements = [...(page.rootElements || [])];
          const rows = [...(page.rows || [])];

          const targetIndex = originalRootElements.findIndex(
            (element) => String(element.id) === String(elementId)
          );

          if (targetIndex === -1) return page;

          const targetElement = originalRootElements[targetIndex];

          // Remove the target from rootElements.
          let rootElements = originalRootElements.filter(
            (element) => String(element.id) !== String(elementId)
          );

          // Remove old position metadata from the target.
          const updatedTarget = { ...targetElement };

          delete updatedTarget.insertBeforeRowId;
          delete updatedTarget.insertAfterRowId;

          let insertAt = rows.length;

          // Generate the new row ID BEFORE assigning anchors.
          const newRowId = crypto.randomUUID();

          // CASE A: Target was anchored before an existing row.
          if (targetElement.insertBeforeRowId != null) {
            const anchorIndex = rows.findIndex(
              (row) =>
                String(row.id) ===
                String(targetElement.insertBeforeRowId)
            );

            if (anchorIndex !== -1) {
              insertAt = anchorIndex;
            }
          }

          // CASE B: Target was anchored after an existing row.
          else if (targetElement.insertAfterRowId != null) {
            const anchorIndex = rows.findIndex(
              (row) =>
                String(row.id) ===
                String(targetElement.insertAfterRowId)
            );

            if (anchorIndex !== -1) {
              insertAt = anchorIndex + 1;
            }
          }

          // CASE C: Target was an unanchored root element.
          else {
            // Keep preceding unanchored standalone elements
            // immediately before the new row.
            rootElements = rootElements.map((element) => {
              const originalIndex = originalRootElements.findIndex(
                (original) =>
                  String(original.id) === String(element.id)
              );

              const appearedBeforeTarget =
                originalIndex !== -1 &&
                originalIndex < targetIndex;

              const hasExistingAnchor =
                element.insertBeforeRowId != null ||
                element.insertAfterRowId != null;

              if (appearedBeforeTarget && !hasExistingAnchor) {
                return {
                  ...element,
                  insertBeforeRowId: newRowId,
                };
              }

              return element;
            });

            insertAt = rows.length;
          }

          // Create the row using THE SAME ID used by the anchors.
          const newRow = {
            id: newRowId,
            fields: [],
            elements:
              placement === "left"
                ? [newElement, updatedTarget]
                : [updatedTarget, newElement],
          };

          rows.splice(insertAt, 0, newRow);

          return {
            ...page,
            rootElements,
            rows,
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
            (element) => String(element.id) === String(elementId)
          );

          if (targetIndex === -1) return page;

          const targetElement = rootElements[targetIndex];

          const standaloneElement = {
            ...newElement,
            ...(targetElement.insertBeforeRowId != null
              ? { insertBeforeRowId: targetElement.insertBeforeRowId }
              : {}),
            ...(targetElement.insertAfterRowId != null
              ? { insertAfterRowId: targetElement.insertAfterRowId }
              : {}),
          };

          rootElements.splice(
            placement === "top" ? targetIndex : targetIndex + 1,
            0,
            standaloneElement
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

            rows: (page.rows || []).map((row) => {
              if (String(row.id) !== String(rowId)) {
                return row;
              }

              return {
                ...row,
                elements: [
                  ...(row.elements || []),
                  newElement,
                ],
              };
            }),
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
  // UPDATE SELECTED ELEMENT (used by ElementSettings)
  // Page-specific headers/footers update inside the selected page.
  // Otherwise, they update the shared default header/footer.
  // Normal elements update inside pages.

  // UPDATE SELECTED ELEMENT (used by ElementSettings)
  // Page-specific headers/footers update inside their own page.
  // Otherwise, headers/footers update the shared default.
  // Normal elements update inside pages.

  const updateSelectedElement = (updatedElement) => {
    // Find the page associated with the selected custom element.
    const selectedCustomPage = pages.find(
      (page) =>
        String(page.id) === String(selectedElementPageId)
    );

    // ---------------------------------------------------
    // PAGE-SPECIFIC HEADER
    // ---------------------------------------------------

    if (
      updatedElement.type === "form_header" &&
      selectedCustomPage?.useCustomHeader === true
    ) {
      setPages((previousPages) =>
        previousPages.map((page) =>
          String(page.id) === String(selectedElementPageId)
            ? {
              ...page,
              header: updatedElement,
            }
            : page
        )
      );

      setSelectedElement(updatedElement);
      return;
    }

    // ---------------------------------------------------
    // PAGE-SPECIFIC FOOTER
    // ---------------------------------------------------

    if (
      updatedElement.type === "form_footer" &&
      selectedCustomPage?.useCustomFooter === true
    ) {
      setPages((previousPages) =>
        previousPages.map((page) =>
          String(page.id) === String(selectedElementPageId)
            ? {
              ...page,
              footer: updatedElement,
            }
            : page
        )
      );

      setSelectedElement(updatedElement);
      return;
    }

    // ---------------------------------------------------
    // SHARED HEADER
    // This works from Page 1, Page 2, Page 3, etc.
    // ---------------------------------------------------

    if (updatedElement.type === "form_header") {
      setHeader((previousHeader) => ({
        ...previousHeader,
        ...updatedElement,
      }));

      setSelectedElement(updatedElement);
      setSelectedElementPageId(null);
      return;
    }

    // ---------------------------------------------------
    // SHARED FOOTER
    // This works from any page displaying the shared footer.
    // ---------------------------------------------------

    if (updatedElement.type === "form_footer") {
      setFooter((previousFooter) => ({
        ...previousFooter,
        ...updatedElement,
      }));

      setSelectedElement(updatedElement);
      setSelectedElementPageId(null);
      return;
    }

    // ---------------------------------------------------
    // NORMAL PAGE ELEMENT
    // ---------------------------------------------------

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
    // Collect IDs of elements inside the deleted row.
    const deletedRow = pages
      .find((page) => String(page.id) === String(pageId))
      ?.rows?.find((row) => String(row.id) === String(rowId));

    const deletedElementIds = [
      ...(deletedRow?.fields ?? []),
      ...(deletedRow?.elements ?? []),
    ]
      .filter((item) => item && typeof item === "object")
      .map((item) => item.id);

    setPages((previousPages) =>
      previousPages.map((page) => {
        if (String(page.id) !== String(pageId)) {
          return page;
        }

        const originalRows = page.rows ?? [];

        const deletedIndex = originalRows.findIndex(
          (row) => String(row.id) === String(rowId)
        );

        if (deletedIndex === -1) return page;

        // Remove the row.
        const updatedRows = originalRows.filter(
          (row) => String(row.id) !== String(rowId)
        );

        const survivingRowIds = new Set(
          updatedRows.map((row) => String(row.id))
        );

        // Find the nearest surviving rows.
        const nextRow = originalRows
          .slice(deletedIndex + 1)
          .find((row) => survivingRowIds.has(String(row.id)));

        const previousRow = originalRows
          .slice(0, deletedIndex)
          .reverse()
          .find((row) => survivingRowIds.has(String(row.id)));

        // Repair standalone elements pointing to the deleted row.
        const updatedRootElements = (page.rootElements ?? []).map(
          (element) => {
            const referencesDeletedRow =
              String(element.insertBeforeRowId) === String(rowId) ||
              String(element.insertAfterRowId) === String(rowId);

            if (!referencesDeletedRow) return element;

            const {
              insertBeforeRowId,
              insertAfterRowId,
              ...elementWithoutAnchors
            } = element;

            if (nextRow) {
              return {
                ...elementWithoutAnchors,
                insertBeforeRowId: nextRow.id,
              };
            }

            if (previousRow) {
              return {
                ...elementWithoutAnchors,
                insertAfterRowId: previousRow.id,
              };
            }

            // No rows remain, so make it an unanchored root element.
            return elementWithoutAnchors;
          }
        );

        return {
          ...page,
          rows: updatedRows,
          rootElements: updatedRootElements,
        };
      })
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

      // 1. Duplicate rows and remember each old row ID's new ID.
      const rowIdMap = new Map();

      const duplicatedRows = (originalPage.rows ?? []).map((row) => {
        const duplicatedRow = createDuplicateRow(row);

        rowIdMap.set(String(row.id), duplicatedRow.id);

        return duplicatedRow;
      });

      // 2. Duplicate standalone elements and update their row anchors.
      const duplicatedRootElements = (
        originalPage.rootElements ?? []
      ).map((element) => {
        const duplicatedElement = createDuplicateElement(element);

        const oldBeforeId = element.insertBeforeRowId;
        const oldAfterId = element.insertAfterRowId;

        return {
          ...duplicatedElement,

          insertBeforeRowId:
            oldBeforeId != null
              ? rowIdMap.get(String(oldBeforeId))
              : undefined,

          insertAfterRowId:
            oldAfterId != null
              ? rowIdMap.get(String(oldAfterId))
              : undefined,
        };
      });

      // 3. Create the duplicated page.
      const duplicatePage = {
        ...originalPage,
        id: crypto.randomUUID(),
        label: `${originalPage.label} Copy`,
        open: true,
        rows: duplicatedRows,
        rootElements: duplicatedRootElements,
        submitButton: originalPage.submitButton
          ? { ...originalPage.submitButton }
          : originalPage.submitButton,
      };

      // 4. Close other pages and insert the duplicate after the original.
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

      // Remove old standalone positioning anchors.
      // Once an element moves into a row, these anchors are no longer needed.
      const {
        insertBeforeRowId,
        insertAfterRowId,
        ...cleanDraggedElement
      } = draggedElement;

      draggedElement = cleanDraggedElement;

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

  // =====================================================================
  // PREVIEW DRAG END
  // Handles moving fields/elements inside LivePreview.
  //
  // Supported destinations:
  // 1. previewDrop      -> Around another element (top/bottom/left/right)
  // 2. previewRowInsert -> Between two rows
  // 3. rootDrop         -> General preview area
  //
  // Important:
  // - Supports fields, elements and rootElements.
  // - Supports moving within the same row.
  // - Supports moving between different rows.
  // - Supports moving between pages.
  // - Does not mutate the original React state.
  // - Does not normalize away newly created single-element rows.
  // =====================================================================


  const handlePreviewDragEnd = ({ active, over }) => {
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle elements dragged from LivePreview.
    if (
      !activeData ||
      !overData ||
      activeData.type !== "previewElement"
    ) {
      return;
    }

    // Only allow drops onto supported preview targets.
    if (
      !["previewDrop", "previewRowInsert", "rootDrop"].includes(
        overData.type
      )
    ) {
      return;
    }

    // Do not move an element to another page accidentally.
    if (overData.pageId == null) return;

    setPages((previousPages) => {
      // STEP 1: Create independent copies.
      const updatedPages = previousPages.map((page) => ({
        ...page,
        rows: (page.rows ?? []).map((row) => ({
          ...row,
          fields: [...(row.fields ?? [])],
          elements: [...(row.elements ?? [])],
        })),
        rootElements: [...(page.rootElements ?? [])],
      }));

      // STEP 2: Find source and target pages.
      const sourcePage = updatedPages.find(
        (page) =>
          String(page.id) === String(activeData.pageId)
      );

      const targetPage = updatedPages.find(
        (page) =>
          String(page.id) === String(overData.pageId)
      );

      if (!sourcePage || !targetPage) {
        return previousPages;
      }

      // STEP 3: Remove the dragged element.
      let draggedElement = null;

      if (activeData.collection === "rootElements") {
        const sourceIndex = sourcePage.rootElements.findIndex(
          (item) =>
            String(item.id) === String(activeData.elementId)
        );

        if (sourceIndex === -1) return previousPages;

        [draggedElement] = sourcePage.rootElements.splice(
          sourceIndex,
          1
        );
      } else {
        if (
          !["fields", "elements"].includes(activeData.collection)
        ) {
          return previousPages;
        }

        const sourceRow = sourcePage.rows.find(
          (row) =>
            String(row.id) === String(activeData.rowId)
        );

        if (!sourceRow) return previousPages;

        const sourceItems = sourceRow[activeData.collection];

        const sourceIndex = sourceItems.findIndex(
          (item) =>
            String(item.id) === String(activeData.elementId)
        );

        if (sourceIndex === -1) return previousPages;

        [draggedElement] = sourceItems.splice(sourceIndex, 1);
      }

      if (!draggedElement) return previousPages;

      // Remove old standalone positioning metadata.
      const {
        insertBeforeRowId,
        insertAfterRowId,
        ...elementWithoutPosition
      } = draggedElement;

      draggedElement = elementWithoutPosition;

      // Helper to remove empty rows.
      const removeEmptyRows = (page) => {
        page.rows = page.rows.filter(
          (row) =>
            (row.fields?.length ?? 0) > 0 ||
            (row.elements?.length ?? 0) > 0
        );
      };


      // CASE 1: DROP BETWEEN ROWS.
      if (overData.type === "previewRowInsert") {
        const originalTargetRows = [...targetPage.rows];

        const originalTargetIndex = originalTargetRows.findIndex(
          (row) =>
            String(row.id) === String(overData.targetRowId)
        );

        if (originalTargetIndex === -1) {
          return previousPages;
        }

        // Remove empty rows after removing the dragged element.
        removeEmptyRows(sourcePage);

        // Check whether the target row still exists.
        const targetRowAfterRemoval = targetPage.rows.find(
          (row) =>
            String(row.id) === String(overData.targetRowId)
        );

        // --------------------------------------------------
        // CASE 1A: Target row has exactly ONE remaining item.
        // Normalize first so the remaining item is converted
        // into a root element before inserting the dragged one.
        // --------------------------------------------------
        const remainingItems = targetRowAfterRemoval
          ? [
            ...(targetRowAfterRemoval.fields ?? []),
            ...(targetRowAfterRemoval.elements ?? []),
          ]
          : [];

        if (remainingItems.length === 1) {
          const remainingElementId = remainingItems[0].id;

          // First normalize the remaining singleton.
          const normalizedPages = normalizeRows(updatedPages);

          const normalizedTargetPage = normalizedPages.find(
            (page) =>
              String(page.id) === String(overData.pageId)
          );

          if (!normalizedTargetPage) {
            return normalizedPages;
          }

          // Find the remaining element after normalization.
          const remainingElementIndex =
            normalizedTargetPage.rootElements.findIndex(
              (element) =>
                String(element.id) === String(remainingElementId)
            );

          const standaloneElement = {
            ...draggedElement,
          };

          // Insert immediately before or after the remaining item.
          if (remainingElementIndex !== -1) {
            normalizedTargetPage.rootElements.splice(
              overData.placement === "before"
                ? remainingElementIndex
                : remainingElementIndex + 1,
              0,
              standaloneElement
            );
          } else {
            normalizedTargetPage.rootElements.push(
              standaloneElement
            );
          }

          return normalizedPages;
        }

        // --------------------------------------------------
        // CASE 1B: Target row still has multiple items.
        // Keep the existing anchor-based behavior.
        // --------------------------------------------------
        const targetStillExists = targetPage.rows.some(
          (row) =>
            String(row.id) === String(overData.targetRowId)
        );

        let standaloneElement;

        if (targetStillExists) {
          standaloneElement = {
            ...draggedElement,
            ...(overData.placement === "before"
              ? { insertBeforeRowId: overData.targetRowId }
              : { insertAfterRowId: overData.targetRowId }),
          };
        } else {
          // Target row became empty.
          const nextSurvivingRow = originalTargetRows
            .slice(originalTargetIndex + 1)
            .find((originalRow) =>
              targetPage.rows.some(
                (row) => String(row.id) === String(originalRow.id)
              )
            );

          const previousSurvivingRow = originalTargetRows
            .slice(0, originalTargetIndex)
            .reverse()
            .find((originalRow) =>
              targetPage.rows.some(
                (row) => String(row.id) === String(originalRow.id)
              )
            );

          if (nextSurvivingRow) {
            standaloneElement = {
              ...draggedElement,
              insertBeforeRowId: nextSurvivingRow.id,
            };
          } else if (previousSurvivingRow) {
            standaloneElement = {
              ...draggedElement,
              insertAfterRowId: previousSurvivingRow.id,
            };
          } else {
            standaloneElement = draggedElement;
          }
        }

        targetPage.rootElements.push(standaloneElement);

        removeEmptyRows(targetPage);

        return normalizeRows(updatedPages);
      }

      // CASE 2: DROP ON GENERAL PREVIEW AREA.
      // Keep the element in its original position.
      if (overData.type === "rootDrop") {
        return previousPages;
      }

      // CASE 3: DROP ABOVE OR BELOW ANOTHER ELEMENT.
      const {
        placement,
        targetRowId,
        targetElementId,
        targetCollection,
      } = overData;

      if (placement === "top" || placement === "bottom") {
        // CASE 3A: Target is another standalone root element.
        if (targetCollection === "rootElements") {
          const targetIndex = targetPage.rootElements.findIndex(
            (item) =>
              String(item.id) === String(targetElementId)
          );

          if (targetIndex === -1) return previousPages;

          const targetElement = targetPage.rootElements[targetIndex];

          // Preserve the target element's original visual position.
          const positionProps = {};

          if (targetElement.insertBeforeRowId != null) {
            positionProps.insertBeforeRowId =
              targetElement.insertBeforeRowId;
          } else if (targetElement.insertAfterRowId != null) {
            positionProps.insertAfterRowId =
              targetElement.insertAfterRowId;
          }

          const positionedDraggedElement = {
            ...draggedElement,
            ...positionProps,
          };

          targetPage.rootElements.splice(
            placement === "top"
              ? targetIndex
              : targetIndex + 1,
            0,
            positionedDraggedElement
          );

          removeEmptyRows(sourcePage);

          return normalizeRows(updatedPages);
        }

        // CASE 3B: Target is inside a row.
        const targetIndex = targetPage.rows.findIndex(
          (row) =>
            String(row.id) === String(targetRowId)
        );

        if (targetIndex === -1) return previousPages;

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
          placement === "top"
            ? targetIndex
            : targetIndex + 1,
          0,
          newRow
        );

        removeEmptyRows(sourcePage);

        return normalizeRows(updatedPages);
      }

      // CASE 4: DROP LEFT OR RIGHT OF ANOTHER ELEMENT.
      if (placement === "left" || placement === "right") {

        // CASE 4A: Target is a standalone root element.
        if (targetCollection === "rootElements") {
          // Save the root-element order before removing the target.
          const originalRootElements = [...targetPage.rootElements];

          const targetIndex = originalRootElements.findIndex(
            (item) =>
              String(item.id) === String(targetElementId)
          );

          if (targetIndex === -1) return previousPages;

          const targetElement = originalRootElements[targetIndex];

          // Remove the target from rootElements.
          targetPage.rootElements = targetPage.rootElements.filter(
            (item) =>
              String(item.id) !== String(targetElementId)
          );

          // Save the target's existing position.
          const targetBeforeRowId = targetElement.insertBeforeRowId;
          const targetAfterRowId = targetElement.insertAfterRowId;

          // Remove position metadata before converting it into a row.
          const {
            insertBeforeRowId,
            insertAfterRowId,
            ...targetElementWithoutPosition
          } = targetElement;

          // Create the new row.
          const newRow = {
            id: crypto.randomUUID(),
            fields: [],
            elements:
              placement === "left"
                ? [draggedElement, targetElementWithoutPosition]
                : [targetElementWithoutPosition, draggedElement],
          };

          // Remove empty source rows.
          removeEmptyRows(sourcePage);

          // Find where the new row belongs.
          let insertAt = targetPage.rows.length;

          if (targetBeforeRowId != null) {
            const beforeIndex = targetPage.rows.findIndex(
              (row) =>
                String(row.id) === String(targetBeforeRowId)
            );

            if (beforeIndex !== -1) {
              insertAt = beforeIndex;
            }
          } else if (targetAfterRowId != null) {
            const afterIndex = targetPage.rows.findIndex(
              (row) =>
                String(row.id) === String(targetAfterRowId)
            );

            if (afterIndex !== -1) {
              insertAt = afterIndex + 1;
            }
          }

          // Insert the new row.
          targetPage.rows.splice(insertAt, 0, newRow);

          // --------------------------------------------------
          // IMPORTANT:
          // If the target was an unanchored root element,
          // preserve the positions of the other unanchored
          // root elements around the new row.
          //
          // Roots before the target -> before the new row.
          // Roots after the target  -> after the new row.
          // --------------------------------------------------

          if (
            targetBeforeRowId == null &&
            targetAfterRowId == null
          ) {
            targetPage.rootElements = targetPage.rootElements.map(
              (element) => {
                // Keep existing anchors unchanged.
                if (
                  element.insertBeforeRowId != null ||
                  element.insertAfterRowId != null
                ) {
                  return element;
                }

                const originalIndex = originalRootElements.findIndex(
                  (original) =>
                    String(original.id) === String(element.id)
                );

                if (originalIndex === -1) {
                  return element;
                }

                if (originalIndex < targetIndex) {
                  return {
                    ...element,
                    insertBeforeRowId: newRow.id,
                    insertAfterRowId: undefined,
                  };
                }

                if (originalIndex > targetIndex) {
                  return {
                    ...element,
                    insertBeforeRowId: undefined,
                    insertAfterRowId: newRow.id,
                  };
                }

                return element;
              }
            );
          }

          return normalizeRows(updatedPages);
        }



        // CASE 4B: Target is inside an existing row.
        if (
          !["fields", "elements"].includes(targetCollection)
        ) {
          return previousPages;
        }

        const targetRow = targetPage.rows.find(
          (row) =>
            String(row.id) === String(targetRowId)
        );

        if (!targetRow) return previousPages;

        const targetItems = targetRow[targetCollection];

        if (!Array.isArray(targetItems)) {
          return previousPages;
        }

        const targetIndex = targetItems.findIndex(
          (item) =>
            String(item.id) === String(targetElementId)
        );

        if (targetIndex === -1) return previousPages;

        targetItems.splice(
          placement === "left"
            ? targetIndex
            : targetIndex + 1,
          0,
          draggedElement
        );

        removeEmptyRows(sourcePage);

        return normalizeRows(updatedPages);
      }

      // Unsupported placement.
      return previousPages;
    });
  };



  // =====================================================================
  // PREVIEW COLLISION DETECTION
  //
  // Priority:
  // 1. previewRowInsert
  // 2. previewDrop
  // 3. rootDrop
  //
  // This ensures small insertion zones are selected before the
  // large general preview drop area.
  // =====================================================================

  const previewCollisionDetection = (args) => {
    const collisions = pointerWithin(args);

    const getData = (collision) =>
      collision.data?.droppableContainer?.data?.current;

    // First: prioritize top/bottom zones around standalone elements.
    const rootElementDropCollisions = collisions.filter(
      (collision) => {
        const data = getData(collision);

        return (
          data?.type === "previewDrop" &&
          data?.targetCollection === "rootElements" &&
          (data?.placement === "top" ||
            data?.placement === "bottom")
        );
      }
    );

    if (rootElementDropCollisions.length > 0) {
      return rootElementDropCollisions;
    }

    // Second: normal row insertion zones.
    const rowInsertCollisions = collisions.filter(
      (collision) =>
        getData(collision)?.type === "previewRowInsert"
    );

    if (rowInsertCollisions.length > 0) {
      return rowInsertCollisions;
    }

    // Third: other preview element drop zones.
    const previewDropCollisions = collisions.filter(
      (collision) =>
        getData(collision)?.type === "previewDrop"
    );

    if (previewDropCollisions.length > 0) {
      return previewDropCollisions;
    }

    // Last: root drop area.
    return collisions.filter(
      (collision) =>
        getData(collision)?.type === "rootDrop"
    );
  };



  // Expand settings panel when custom header/footer is enabled
  // and its text editor is displayed in PageSettings.
  const isPageSettingsExpanded =
    selectedTarget?.type === "page" &&
    (
      selectedPage?.useCustomHeader === true ||
      selectedPage?.useCustomFooter === true
    );


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
          : (
            isPageSettingsExpanded ||
            ["paragraph", "form_header", "form_footer"].includes(
              selectedElement?.type
            )
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
            ) : selectedTarget?.type === "page" && selectedPage ? (
              <PageSettings
                page={selectedPage}
                onChange={updateSelectedPage}
                onClose={() => setSelectedTarget(null)}
              />
            ) : selectedTarget?.type === "row" && selectedRow ? (
              <RowSettings
                row={selectedRow}
                page={selectedPage}
                onChange={updateSelectedRow}
                onClose={() => setSelectedTarget(null)}
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
                    //select handlers pass to pannel 
                    onSelectElement={handleSelectExistingElement}
                    onSelectPage={handleSelectPage}
                    onSelectRow={handleSelectRow}
                    normalizeRows={normalizeRows}
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

          {/* Preview with its own drag & drop context */}
          <DndContext
            sensors={sensors}
            collisionDetection={previewCollisionDetection}
            onDragStart={(event) => {
              const data = event.active.data.current;

              setActiveDragItemLive({
                label: data?.label || "Element",
                icon: data?.icon || FileIcon,
                type: data?.type,
              });
            }}
            onDragEnd={(event) => {
              handlePreviewDragEnd(event);
              setActiveDragItemLive(null);
            }}
            onDragCancel={() => {
              setActiveDragItemLive(null);
            }}
          >
            <LivePreview
              pages={pages}
              activePageId={activePageId}
              header={header}
              footer={footer}
              templateTitle={templateTitle}
              formSettings={selectedTemplate}
              selectedElementId={selectedElement?.id}
              onSelectElement={handleSelectExistingElement}
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

            {/* Floating drag preview */}
            <DragOverlay dropAnimation={null}>
              {activeDragItemLive && (
                <div className="live-drag-preview">
                  <span className="live-drag-preview__icon">
                    <Icon source={activeDragItemLive.icon} />
                  </span>

                  <span className="live-drag-preview__label">
                    {activeDragItemLive.label}
                  </span>
                </div>
              )}
            </DragOverlay>
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