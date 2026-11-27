
import React, { useState, useRef } from "react";

// ======================================================
// 1. DRAG AND DROP IMPORTS
// ======================================================

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    pointerWithin,
    DragOverlay,
} from "@dnd-kit/core";

import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

// ======================================================
// 2. SHOPIFY POLARIS IMPORTS
// ======================================================

import {
    Divider,
    Text,
    Icon,
} from "@shopify/polaris";

import {
    PlusCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    FileIcon,
    FolderIcon,
    LayoutSectionIcon,
    DuplicateIcon,
    DragHandleIcon,
} from "@shopify/polaris-icons";

// ======================================================
// 3. PROJECT IMPORTS
// ======================================================

import { ELEMENT_TYPES } from "../../utils/elementsConfig.js";
import ElementActions from "./ElementActions.jsx";

import { createElementConfig } from "../../utils/elementHelpers.js";
import * as PolarisIcons from "@shopify/polaris-icons";

import "../../ElementsPanel.css";

// ======================================================
// 4. HELPER FUNCTIONS
// ======================================================

// Get the Polaris icon associated with an element type.
const getElementIcon = (type) => {
    const normalizedType =
        type === "first_name" ||
            type === "last_name" ||
            type === "First Name" ||
            type === "Last Name"
            ? "name"
            : type;

    const elementConfig = ELEMENT_TYPES.find(
        (item) => item.type === normalizedType
    );

    return elementConfig?.icon || FileIcon;
};

// Get the unique drag ID for a field.
// Get a stable drag ID for every default field.
const getDragItemId = (item, index) => {
    // Fields with their own ID use that ID.
    if (
        item &&
        typeof item === "object" &&
        item.id != null
    ) {
        return `field-${item.id}`;
    }

    // String fields use their actual name instead of their index.
    if (typeof item === "string") {
        return `field-${encodeURIComponent(
            item.trim().toLowerCase()
        )}`;
    }

    // Objects without IDs use their available identifying value.
    const fieldName =
        item?.name ||
        item?.label ||
        item?.type;

    if (fieldName) {
        return `field-${encodeURIComponent(
            String(fieldName).trim().toLowerCase()
        )}`;
    }

    // Last-resort fallback for unidentified fields.
    return `field-index-${index}`;
};

// Get the correct collection for a dragged item.
const getSourceCollection = (type) => {
    if (type === "field") return "fields";

    if (
        type === "element" ||
        type === "rootElement"
    ) {
        return "elements";
    }

    return null;
};

// ======================================================
// 5. MAIN COMPONENT: ELEMENTS PANEL
// Manages pages, rows, elements, and drag-and-drop.
// ======================================================

export default function ElementsPanel({
    pages,
    setPages,

    //normalize rows
    normalizeRows,

    // Shared header and footer settings.
    header,
    footer,

    // Element selection.
    onSelectElement,

    //page & row
    onSelectPage,
    onSelectRow,

    // Element toolbox actions.
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,

    // Element picker.
    openElementPicker,

    // Row toolbox actions.
    onToggleRowVisibility,
    onDuplicateRow,
    onDeleteRow,

    // Page toolbox action.
    onDuplicatePage,
}) {
    // This get the element pannel aera and prevent it from getting in live preview 
    const elementsPanelRef = useRef(null);
    const restrictOverlayToElementsPanel = ({ transform, draggingNodeRect }) => {
        const panel = elementsPanelRef.current;

        if (!panel || !draggingNodeRect) {
            return transform;
        }

        const panelRect = panel.getBoundingClientRect();

        const minX = panelRect.left - draggingNodeRect.left;
        const maxX = panelRect.right - draggingNodeRect.right;

        const minY = panelRect.top - draggingNodeRect.top;
        const maxY = panelRect.bottom - draggingNodeRect.bottom;

        return {
            ...transform,
            x: Math.min(Math.max(transform.x, minX), maxX),
            y: Math.min(Math.max(transform.y, minY), maxY),
        };
    };

    // Stores information about the currently dragged item.
    const [activeDragItem, setActiveDragItem] = useState(null);

    // Configure drag activation after a 5px pointer movement.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // ======================================================
    // 5.1. MOVE ELEMENTS BETWEEN ROWS AND PAGES
    // ======================================================


    const handlePageContentDragEnd = (event) => {
        const { active, over } = event;

        if (!over || String(active.id) === String(over.id)) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) return;

        // Page and row dragging are handled separately.
        if (
            activeData.type === "page" ||
            activeData.type === "row"
        ) {
            return;
        }

        // Only these item types can be moved by this handler.
        const sourceCollection = getSourceCollection(activeData.type);

        if (!sourceCollection) return;

        const sourcePageId = activeData.pageId;
        const targetPageId = overData.pageId;

        if (
            sourcePageId == null ||
            targetPageId == null
        ) {
            return;
        }

        // Only allow supported content drop targets.
        const supportedTargets = [
            "field",
            "element",
            "rootElement",
            "rowDrop",
            "row",
            "pageRoot",
            "pageTop",
        ];

        if (!supportedTargets.includes(overData.type)) {
            return;
        }

        // ======================================================
        // STEP 1: GET DRAGGED ELEMENT POSITION.
        // ======================================================

        const activeRect = active.rect.current.translated;
        const overRect = over.rect;

        const draggedCenterY = activeRect
            ? activeRect.top + activeRect.height / 2
            : null;

        // Determine whether the dragged item should be inserted
        // before or after the item underneath it.
        let placement = "after";

        if (activeRect && overRect) {
            const activeCenter =
                activeRect.top + activeRect.height / 2;

            const overCenter =
                overRect.top + overRect.height / 2;

            placement =
                activeCenter < overCenter
                    ? "before"
                    : "after";
        }

        // ======================================================
        // STEP 2: CHECK THE ACTUAL TARGET ROW BOUNDARY.
        //
        // A rowDrop container may be larger than the visible row.
        // Never insert into a row when the dragged element is
        // actually positioned outside its rendered boundaries.
        // ======================================================

        const targetRowId = overData.rowId ?? null;

        const rowRelatedTargets = [
            "rowDrop",
            "row",
            "field",
            "element",
        ];

        let isOutsideTargetRow = false;

        if (
            rowRelatedTargets.includes(overData.type) &&
            targetRowId != null &&
            draggedCenterY !== null
        ) {
            const rowElements = Array.from(
                document.querySelectorAll(
                    `[data-element-tree-row="true"][data-page-id="${String(targetPageId)}"]`
                )
            );

            const targetRowElement = rowElements.find(
                (rowElement) =>
                    String(rowElement.dataset.rowId) ===
                    String(targetRowId)
            );

            if (targetRowElement) {
                const rowRect =
                    targetRowElement.getBoundingClientRect();

                isOutsideTargetRow =
                    draggedCenterY < rowRect.top ||
                    draggedCenterY > rowRect.bottom;
            }
        }

        console.log("CONTENT DROP DEBUG", {
            activeId: active.id,
            activeType: activeData.type,
            overId: over.id,
            overType: overData.type,
            targetRowId,
            draggedCenterY,
            isOutsideTargetRow,
            placement,
        });

        // If the dragged item is outside the actual row,
        // handle the drop as a standalone element.
        const shouldDropAsStandalone =
            isOutsideTargetRow;

        setPages((previousPages) => {

            // ======================================================
            // STEP 3: CREATE SAFE COPIES OF THE PAGE DATA.
            // ======================================================

            const updatedPages = previousPages.map((page) => ({
                ...page,
                rows: (page.rows ?? []).map((row) => ({
                    ...row,
                    fields: [...(row.fields ?? [])],
                    elements: [...(row.elements ?? [])],
                })),
                rootElements: [...(page.rootElements ?? [])],
            }));

            const sourcePage = updatedPages.find(
                (page) =>
                    String(page.id) === String(sourcePageId)
            );

            const targetPage = updatedPages.find(
                (page) =>
                    String(page.id) === String(targetPageId)
            );

            if (!sourcePage || !targetPage) {
                return previousPages;
            }

            // ======================================================
            // STEP 4: FIND THE SOURCE ROW.
            // ======================================================

            const sourceRow =
                activeData.rowId != null
                    ? sourcePage.rows.find(
                        (row) =>
                            String(row.id) ===
                            String(activeData.rowId)
                    )
                    : null;

            // ======================================================
            // STEP 5: FIND THE TARGET ROW.
            // ======================================================

            const targetRow =
                targetRowId != null
                    ? targetPage.rows.find(
                        (row) =>
                            String(row.id) ===
                            String(targetRowId)
                    )
                    : null;

            if (
                targetRowId != null &&
                !targetRow
            ) {
                return previousPages;
            }

            // ======================================================
            // STEP 6: VALIDATE SOURCE AND TARGET COLLECTIONS.
            // ======================================================

            if (
                (activeData.type === "field" ||
                    activeData.type === "element") &&
                !sourceRow
            ) {
                return previousPages;
            }

            if (
                targetRow &&
                !Array.isArray(targetRow.fields)
            ) {
                targetRow.fields = [];
            }

            if (
                targetRow &&
                !Array.isArray(targetRow.elements)
            ) {
                targetRow.elements = [];
            }

            // ======================================================
            // STEP 7: VALIDATE THE TARGET ELEMENT.
            // ======================================================

            if (overData.type === "rootElement") {
                const targetExists =
                    targetPage.rootElements.some(
                        (item) =>
                            `element-${item.id}` ===
                            String(over.id)
                    );

                if (!targetExists) {
                    return previousPages;
                }
            }

            if (
                targetRow &&
                (
                    overData.type === "field" ||
                    overData.type === "element"
                )
            ) {
                const targetCollection =
                    overData.type === "field"
                        ? "fields"
                        : "elements";

                const targetItems =
                    targetRow[targetCollection] ?? [];

                const targetExists =
                    targetItems.some((item, index) => {
                        const itemId =
                            targetCollection === "fields"
                                ? getDragItemId(item, index)
                                : `element-${item.id}`;

                        return String(itemId) === String(over.id);
                    });

                if (!targetExists) {
                    return previousPages;
                }
            }

            // ======================================================
            // STEP 8: FIND THE DRAGGED ITEM.
            // ======================================================

            let draggedItem = null;
            let sourceIndex = -1;

            if (activeData.type === "field") {
                sourceIndex = sourceRow.fields.findIndex(
                    (item, index) =>
                        String(getDragItemId(item, index)) ===
                        String(active.id)
                );

                if (sourceIndex !== -1) {
                    draggedItem = sourceRow.fields[sourceIndex];
                }
            }

            else if (activeData.type === "element") {
                sourceIndex = sourceRow.elements.findIndex(
                    (item) =>
                        `element-${item.id}` === String(active.id)
                );

                if (sourceIndex !== -1) {
                    draggedItem = sourceRow.elements[sourceIndex];
                }
            }

            else if (activeData.type === "rootElement") {
                sourceIndex = sourcePage.rootElements.findIndex(
                    (item) =>
                        `element-${item.id}` === String(active.id)
                );

                if (sourceIndex !== -1) {
                    draggedItem = sourcePage.rootElements[sourceIndex];
                }
            }

            if (!draggedItem || sourceIndex === -1) {
                return previousPages;
            }

            // ======================================================
            // STEP 9: REORDER ITEMS INSIDE THE SAME ROW.
            // Save the mixed order in sourceRow.itemOrder.
            // ======================================================

            if (
                !shouldDropAsStandalone &&
                sourcePage === targetPage &&
                sourceRow &&
                targetRow &&
                String(sourceRow.id) === String(targetRow.id) &&
                (
                    overData.type === "field" ||
                    overData.type === "element"
                )
            ) {
                const combinedItems = [
                    ...(sourceRow.fields || []).map((field, index) => ({
                        item: field,
                        collection: "fields",
                        dragId: getDragItemId(field, index),
                    })),

                    ...(sourceRow.elements || []).map((element) => ({
                        item: element,
                        collection: "elements",
                        dragId: `element-${element.id}`,
                    })),
                ];

                // Restore the previously saved mixed order.
                const savedOrder = sourceRow.itemOrder || [];

                combinedItems.sort((a, b) => {
                    const indexA = savedOrder.indexOf(a.dragId);
                    const indexB = savedOrder.indexOf(b.dragId);

                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;

                    return indexA - indexB;
                });

                const oldIndex = combinedItems.findIndex(
                    (entry) =>
                        String(entry.dragId) === String(active.id)
                );

                const newIndex = combinedItems.findIndex(
                    (entry) =>
                        String(entry.dragId) === String(over.id)
                );

                if (oldIndex === -1 || newIndex === -1) {
                    return previousPages;
                }

                const reorderedItems = arrayMove(
                    combinedItems,
                    oldIndex,
                    newIndex
                );

                // Keep the original collections separate.
                sourceRow.fields = reorderedItems
                    .filter((entry) => entry.collection === "fields")
                    .map((entry) => entry.item);

                sourceRow.elements = reorderedItems
                    .filter((entry) => entry.collection === "elements")
                    .map((entry) => entry.item);

                // Save the actual visual order.
                sourceRow.itemOrder = reorderedItems.map(
                    (entry) => entry.dragId
                );

                return normalizeRows
                    ? normalizeRows(updatedPages)
                    : updatedPages;
            }

            // ======================================================
            // STEP 10: REMOVE THE DRAGGED ITEM FROM ITS SOURCE.
            // ======================================================

            if (activeData.type === "field") {
                sourceRow.fields.splice(sourceIndex, 1);
            }

            else if (activeData.type === "element") {
                sourceRow.elements.splice(sourceIndex, 1);
            }

            else if (activeData.type === "rootElement") {
                sourcePage.rootElements.splice(sourceIndex, 1);
            }

            // ======================================================
            // STEP 11: CLEAR OLD ROOT POSITION ANCHORS.
            // The destination decides the new position.
            // ======================================================

            const {
                insertBeforeRowId,
                insertAfterRowId,
                ...cleanDraggedItem
            } = draggedItem;

            draggedItem = cleanDraggedItem;

            // ======================================================
            // STEP 12: DROP ONTO A FIELD OR CREATED ELEMENT.
            // ======================================================

            if (
                !shouldDropAsStandalone &&
                targetRow &&
                (
                    overData.type === "field" ||
                    overData.type === "element"
                )
            ) {
                const targetCollection =
                    overData.type === "field"
                        ? "fields"
                        : "elements";

                // Keep the dragged item in its original collection.
                const destinationCollection = sourceCollection;

                const destinationItems =
                    targetRow[destinationCollection];

                let insertIndex = destinationItems.length;

                // Insert relative to the target when both collections
                // are the same.
                if (
                    destinationCollection === targetCollection
                ) {
                    const currentTargetIndex =
                        destinationItems.findIndex(
                            (item, index) => {
                                const itemId =
                                    targetCollection === "fields"
                                        ? getDragItemId(item, index)
                                        : `element-${item.id}`;

                                return String(itemId) === String(over.id);
                            }
                        );

                    if (currentTargetIndex === -1) {
                        return previousPages;
                    }

                    insertIndex =
                        currentTargetIndex +
                        (placement === "after" ? 1 : 0);
                }

                destinationItems.splice(
                    insertIndex,
                    0,
                    draggedItem
                );
            }

            // ======================================================
            // STEP 13: DROP INSIDE THE ACTUAL ROW BODY.
            // ======================================================

            else if (
                !shouldDropAsStandalone &&
                targetRow &&
                (
                    overData.type === "rowDrop" ||
                    overData.type === "row"
                )
            ) {
                targetRow[sourceCollection].push(draggedItem);
            }

            // ======================================================
            // STEP 14: DROP ONTO ANOTHER STANDALONE ELEMENT.
            // ======================================================

            else if (
                !shouldDropAsStandalone &&
                overData.type === "rootElement"
            ) {
                const rootElements = targetPage.rootElements;

                const currentTargetIndex = rootElements.findIndex(
                    (item) =>
                        `element-${item.id}` === String(over.id)
                );

                if (currentTargetIndex === -1) {
                    return previousPages;
                }

                const currentTargetElement =
                    rootElements[currentTargetIndex];

                const standaloneElement = {
                    ...draggedItem,

                    ...(currentTargetElement.insertBeforeRowId != null
                        ? {
                            insertBeforeRowId:
                                currentTargetElement.insertBeforeRowId,
                        }
                        : {}),

                    ...(currentTargetElement.insertAfterRowId != null
                        ? {
                            insertAfterRowId:
                                currentTargetElement.insertAfterRowId,
                        }
                        : {}),
                };

                rootElements.splice(
                    currentTargetIndex +
                    (placement === "after" ? 1 : 0),
                    0,
                    standaloneElement
                );
            }
            // ======================================================
            // STEP 15A: DROP AT THE VERY TOP OF VISUAL CONTENT.
            // Always insert before every existing root element.
            // ======================================================

            else if (overData.type === "pageTop") {
                const firstRow = targetPage.rows[0] ?? null;

                const topElement = firstRow
                    ? {
                        ...draggedItem,
                        insertBeforeRowId: firstRow.id,
                    }
                    : draggedItem;

                // Put it before all existing standalone elements.
                targetPage.rootElements.unshift(topElement);
            }

            // ======================================================
            // STEP 15: DROP ONTO PAGE ROOT OR OUTSIDE ROW.
            // Create a standalone element at the correct position.
            // ======================================================

            else if (
                overData.type === "pageRoot" ||
                shouldDropAsStandalone
            ) {
                const dropY = draggedCenterY;

                const rowElements = Array.from(
                    document.querySelectorAll(
                        `[data-element-tree-row="true"][data-page-id="${String(targetPageId)}"]`
                    )
                );

                if (
                    rowElements.length === 0 ||
                    dropY === null
                ) {
                    targetPage.rootElements.push(draggedItem);
                } else {
                    const rowPositions = rowElements
                        .map((rowElement) => ({
                            rowId: rowElement.dataset.rowId,
                            top: rowElement.getBoundingClientRect().top,
                            bottom: rowElement.getBoundingClientRect().bottom,
                        }))
                        .filter((row) => row.rowId != null)
                        .sort((a, b) => a.top - b.top);

                    const nextRow = rowPositions.find(
                        (row) =>
                            dropY < (row.top + row.bottom) / 2
                    );

                    if (nextRow) {
                        targetPage.rootElements.push({
                            ...draggedItem,
                            insertBeforeRowId: nextRow.rowId,
                        });
                    } else if (rowPositions.length > 0) {
                        const lastRow =
                            rowPositions[rowPositions.length - 1];

                        targetPage.rootElements.push({
                            ...draggedItem,
                            insertAfterRowId: lastRow.rowId,
                        });
                    } else {
                        targetPage.rootElements.push(draggedItem);
                    }
                }
            }

            // ======================================================
            // STEP 16: CANCEL ANY UNHANDLED DROP TARGET.
            // ======================================================

            else {
                return previousPages;
            }

            // ======================================================
            // STEP 17: NORMALIZE ROWS.
            // Remove empty rows and convert one-item rows
            // into standalone elements.
            // ======================================================

            return normalizeRows
                ? normalizeRows(updatedPages)
                : updatedPages;
        });
    };

    // ======================================================
    // 5.2. REORDER PAGES
    // ======================================================

    const handlePageDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (
            activeData?.type !== "page" ||
            overData?.type !== "page"
        ) {
            return;
        }

        // Get page IDs from the drag data.
        const activePageId = activeData.pageId;
        const overPageId = overData.pageId;

        if (
            activePageId == null ||
            overPageId == null ||
            String(activePageId) === String(overPageId)
        ) {
            return;
        }

        setPages((previousPages) => {
            const oldIndex = previousPages.findIndex(
                (page) =>
                    String(page.id) === String(activePageId)
            );

            const newIndex = previousPages.findIndex(
                (page) =>
                    String(page.id) === String(overPageId)
            );

            if (
                oldIndex === -1 ||
                newIndex === -1
            ) {
                return previousPages;
            }

            // Move the complete page to the new position.
            return arrayMove(
                previousPages,
                oldIndex,
                newIndex
            );
        });
    };

    // ======================================================
    // 5.3. REORDER ROWS
    // ======================================================

    const handleRowDragEnd = (event, pageId) => {
        const { active, over } = event;

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type !== "row") return;

        const activeRowId = activeData.rowId;

        // Support both the sortable row and its inner drop area.
        let overRowId = overData?.rowId;

        if (overRowId == null) {
            const overId = String(over.id);

            if (overId.startsWith("row-drop-")) {
                overRowId = overId.replace(
                    "row-drop-",
                    ""
                );
            } else if (overId.startsWith("row-")) {
                overRowId = overId.replace(
                    "row-",
                    ""
                );
            }
        }

        if (
            activeRowId == null ||
            overRowId == null
        ) {
            return;
        }

        if (
            String(activeRowId) ===
            String(overRowId)
        ) {
            return;
        }

        setPages((previousPages) =>
            previousPages.map((page) => {
                if (
                    String(page.id) !== String(pageId)
                ) {
                    return page;
                }

                const rows = [...(page.rows ?? [])];

                const oldIndex = rows.findIndex(
                    (row) =>
                        String(row.id) ===
                        String(activeRowId)
                );

                const newIndex = rows.findIndex(
                    (row) =>
                        String(row.id) ===
                        String(overRowId)
                );

                if (
                    oldIndex === -1 ||
                    newIndex === -1
                ) {
                    return page;
                }

                return {
                    ...page,
                    rows: arrayMove(
                        rows,
                        oldIndex,
                        newIndex
                    ),
                };
            })
        );
    };

    // ======================================================
    // 5.4. REORDER FIELDS INSIDE A ROW
    // ======================================================

    const handleFieldDragEnd = (event, pageId, rowId) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setPages((previousPages) =>
            previousPages.map((page) => {
                if (
                    String(page.id) !== String(pageId)
                ) {
                    return page;
                }

                return {
                    ...page,
                    rows: (page.rows || []).map((row) => {
                        if (
                            String(row.id) !== String(rowId)
                        ) {
                            return row;
                        }

                        // Get the unique ID for each field.
                        const getFieldId = (field, index) =>
                            getDragItemId(field, index);

                        const oldIndex = row.fields.findIndex(
                            (field, index) =>
                                getFieldId(field, index) ===
                                active.id
                        );

                        const newIndex = row.fields.findIndex(
                            (field, index) =>
                                getFieldId(field, index) ===
                                over.id
                        );

                        if (
                            oldIndex === -1 ||
                            newIndex === -1
                        ) {
                            return row;
                        }

                        // Reorder the fields.
                        return {
                            ...row,
                            fields: arrayMove(
                                row.fields,
                                oldIndex,
                                newIndex
                            ),
                        };
                    }),
                };
            })
        );
    };

    // ======================================================
    // 5.5. REORDER CREATED ELEMENTS
    // ======================================================

    const handleElementDragEnd = (
        event,
        pageId,
        rowId = null
    ) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setPages((previousPages) =>
            previousPages.map((page) => {
                if (
                    String(page.id) !== String(pageId)
                ) {
                    return page;
                }

                // CASE 1: Reorder elements inside a row.
                if (rowId !== null) {
                    return {
                        ...page,
                        rows: page.rows.map((row) => {
                            if (
                                String(row.id) !== String(rowId)
                            ) {
                                return row;
                            }

                            const oldIndex =
                                (row.elements || []).findIndex(
                                    (element) =>
                                        `element-${element.id}` ===
                                        active.id
                                );

                            const newIndex =
                                (row.elements || []).findIndex(
                                    (element) =>
                                        `element-${element.id}` ===
                                        over.id
                                );

                            if (
                                oldIndex === -1 ||
                                newIndex === -1
                            ) {
                                return row;
                            }

                            return {
                                ...row,
                                elements: arrayMove(
                                    row.elements || [],
                                    oldIndex,
                                    newIndex
                                ),
                            };
                        }),
                    };
                }

                // CASE 2: Reorder standalone page elements.
                const rootElements =
                    page.rootElements || [];

                const oldIndex = rootElements.findIndex(
                    (element) =>
                        `element-${element.id}` === active.id
                );

                const newIndex = rootElements.findIndex(
                    (element) =>
                        `element-${element.id}` === over.id
                );

                if (
                    oldIndex === -1 ||
                    newIndex === -1
                ) {
                    return page;
                }

                return {
                    ...page,
                    rootElements: arrayMove(
                        rootElements,
                        oldIndex,
                        newIndex
                    ),
                };
            })
        );
    };

    // ======================================================
    // 5.6. HANDLE ALL DRAG END EVENTS
    // ======================================================

    const handleAllDragEnd = (event) => {
        const activeData = event.active.data.current;

        if (!activeData) return;

        // Handle page reordering.
        if (activeData.type === "page") {
            handlePageDragEnd(event);
            return;
        }

        // Handle row reordering.
        if (activeData.type === "row") {
            handleRowDragEnd(
                event,
                activeData.pageId
            );
            return;
        }

        // Handle fields and created elements.
        handlePageContentDragEnd(event);
    };

    // ======================================================
    // 5.7. ADD A NEW PAGE
    // ======================================================

    const addPage = () => {
        setPages((previousPages) => [
            // Close all previously opened pages.
            ...previousPages.map((page) => ({
                ...page,
                open: false,
            })),

            // Create the new page.
            {
                id: Date.now(),
                label: `Page ${previousPages.length + 1}`,
                open: true,
                rows: [],
                rootElements: [],
            },
        ]);
    };

    // ======================================================
    // 5.8. TOGGLE PAGE OPEN/CLOSED
    // ======================================================

    const togglePage = (pageId) => {
        setPages((previousPages) =>
            previousPages.map((page) => ({
                ...page,
                open:
                    page.id === pageId
                        ? !page.open
                        : false,
            }))
        );
    };

    // ======================================================
    // 6. RENDER ELEMENTS PANEL
    // ======================================================

    return (
        // take the info aabout the elemnt pannel div to get its aera so prevent from going out
        <div className="elements-panel" ref={elementsPanelRef}>

            {/* SHARED HEADER */}

            <button
                type="button"
                className="elements-panel__header elements-panel__header--clickable"
                onClick={() => {
                    if (header) {
                        onSelectElement?.(header);
                    }
                }}
                disabled={!header}
            >
                <span className="elements-panel__section-icon">
                    <Icon source={LayoutSectionIcon} />
                </span>

                <Text as="span" fontWeight="semibold">
                    Header
                </Text>
            </button>

            <Divider />

            {/* ELEMENTS SECTION TITLE */}

            <div className="elements-panel__section-title">
                <Text as="span" variant="bodySm" tone="subdued">
                    Elements
                </Text>
            </div>

            {/* PAGES AND ELEMENTS TREE */}

            <div className="element-tree">

                {/* SHARED DRAG AND DROP CONTEXT */}


                <DndContext
                    sensors={sensors}

                    // Restrict page, row, and element dragging to valid targets.
                    collisionDetection={(args) => {
                        console.log("ELEMENTS PANEL COLLISION RUNNING");

                        const activeType = args.active.data.current?.type;
                        const activeData = args.active.data.current;

                        // =====================================================
                        // PAGE DRAGGING: Only detect pages.
                        // =====================================================
                        if (activeType === "page") {
                            const pageContainers =
                                args.droppableContainers.filter(
                                    (container) =>
                                        container.data.current?.type === "page"
                                );

                            return closestCenter({
                                ...args,
                                droppableContainers: pageContainers,
                            });
                        }

                        // =====================================================
                        // ROW DRAGGING: Only detect rows.
                        // =====================================================
                        if (activeType === "row") {
                            const rowContainers =
                                args.droppableContainers.filter(
                                    (container) =>
                                        container.data.current?.type === "row"
                                );

                            return closestCenter({
                                ...args,
                                droppableContainers: rowContainers,
                            });
                        }

                        // =====================================================
                        // ELEMENT AND FIELD DRAGGING
                        // Exclude the active item and page containers.
                        // =====================================================
                        const validDropContainers =
                            args.droppableContainers.filter((container) => {
                                const type = container.data.current?.type;

                                return (
                                    String(container.id) !== String(args.active.id) &&
                                    type !== "page"
                                );
                            });

                        const pointerCollisions = pointerWithin({
                            ...args,
                            droppableContainers: validDropContainers,
                        });

                        console.log(
                            "DROP TARGET DETAILS",
                            JSON.stringify(
                                {
                                    activeId: args.active.id,
                                    activeType,
                                    pointerCollisions: pointerCollisions.map(
                                        (collision) => ({
                                            id: collision.id,
                                            type: collision.data?.droppableContainer?.data?.current?.type,
                                            pageId: collision.data?.droppableContainer?.data?.current?.pageId,
                                            rowId: collision.data?.droppableContainer?.data?.current?.rowId,
                                        })
                                    ),
                                },
                                null,
                                2
                            )
                        );

                        // =====================================================
                        // SAME ROW DETECTION
                        // =====================================================
                        const isOverSameRow = pointerCollisions.some((collision) => {
                            const data =
                                collision.data?.droppableContainer?.data?.current;

                            return (
                                data?.type === "row" &&
                                String(data.rowId) === String(activeData?.rowId) &&
                                String(data.pageId) === String(activeData?.pageId)
                            );
                        });

                        // If the row is detected, find the closest field/element
                        // inside that same row.
                        if (isOverSameRow) {
                            const sameRowItems =
                                args.droppableContainers.filter((container) => {
                                    const data = container.data.current;

                                    return (
                                        (data?.type === "field" ||
                                            data?.type === "element") &&
                                        String(data.rowId) === String(activeData.rowId) &&
                                        String(data.pageId) === String(activeData.pageId) &&
                                        String(container.id) !== String(args.active.id)
                                    );
                                });

                            if (sameRowItems.length > 0) {
                                const itemCollisions = closestCenter({
                                    ...args,
                                    droppableContainers: sameRowItems,
                                });

                                if (itemCollisions.length > 0) {
                                    return itemCollisions;
                                }
                            }
                        }

                        // =====================================================
                        // STANDALONE ELEMENT FALLBACK
                        // =====================================================
                        // If pointerWithin detects no target, or detects only
                        // the page root, find the nearest standalone element
                        // on the same page.
                        const shouldUseRootFallback =
                            pointerCollisions.length === 0 ||
                            pointerCollisions.every((collision) => {
                                const type =
                                    collision.data?.droppableContainer?.data?.current?.type;

                                return type === "pageRoot";
                            });

                        if (
                            activeType === "rootElement" &&
                            shouldUseRootFallback
                        ) {
                            const rootElementContainers =
                                args.droppableContainers.filter((container) => {
                                    const data = container.data.current;

                                    return (
                                        data?.type === "rootElement" &&
                                        String(container.id) !== String(args.active.id) &&
                                        String(data.pageId) === String(activeData.pageId)
                                    );
                                });

                            if (rootElementContainers.length > 0) {
                                const rootElementCollisions = closestCenter({
                                    ...args,
                                    droppableContainers: rootElementContainers,
                                });

                                if (rootElementCollisions.length > 0) {
                                    return rootElementCollisions;
                                }
                            }
                        }

                        // =====================================================
                        // NO COLLISION
                        // =====================================================
                        // This check must stay AFTER the standalone fallback.
                        if (pointerCollisions.length === 0) {
                            return [];
                        }

                        // =====================================================
                        // COLLISION PRIORITY
                        // Prefer specific targets over the large page root.
                        // =====================================================
                        const priority = {
                            pageTop: 7,
                            rowBoundary: 6,
                            field: 5,
                            element: 5,
                            rootElement: 5,
                            rowDrop: 4,
                            row: 3,
                            pageRoot: 1,
                        };

                        return [...pointerCollisions].sort((a, b) => {
                            const typeA =
                                a.data?.droppableContainer?.data?.current?.type;

                            const typeB =
                                b.data?.droppableContainer?.data?.current?.type;

                            return (
                                (priority[typeB] || 0) -
                                (priority[typeA] || 0)
                            );
                        });
                    }}

                    // =====================================================
                    // DRAG START
                    // =====================================================
                    onDragStart={(event) => {
                        const data = event.active.data.current;

                        setActiveDragItem({
                            label: data?.label || "Element",
                            icon: data?.icon || FileIcon,
                            type: data?.type,
                        });
                    }}

                    // =====================================================
                    // DRAG END
                    // =====================================================
                    onDragEnd={(event) => {
                        console.log("ELEMENT DRAG DEBUG", {
                            activeId: event.active.id,
                            activeData: event.active.data.current,
                            overId: event.over?.id,
                            overData: event.over?.data.current,
                        });

                        handleAllDragEnd(event);
                        setActiveDragItem(null);
                    }}

                    // =====================================================
                    // DRAG CANCEL
                    // =====================================================
                    onDragCancel={() => {
                        setActiveDragItem(null);
                    }}
                >
                    <SortableContext
                        items={pages.map((page) => `page-${page.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        {pages.map((page) => (
                            <SortablePage
                                key={page.id}
                                page={page}
                                togglePage={togglePage}

                                // Page and row settings.
                                onSelectPage={onSelectPage}
                                onSelectRow={onSelectRow}

                                // Drag-and-drop handlers.
                                handleFieldDragEnd={handleFieldDragEnd}
                                handleElementDragEnd={handleElementDragEnd}

                                // Element picker.
                                openElementPicker={openElementPicker}

                                // Element selection.
                                onSelectElement={onSelectElement}

                                // Element toolbox actions.
                                onToggleElementVisibility={onToggleElementVisibility}
                                onDuplicateElement={onDuplicateElement}
                                onDeleteElement={onDeleteElement}

                                // Row toolbox actions.
                                onToggleRowVisibility={onToggleRowVisibility}
                                onDuplicateRow={onDuplicateRow}
                                onDeleteRow={onDeleteRow}

                                // Page toolbox action.
                                onDuplicatePage={onDuplicatePage}
                            />
                        ))}
                    </SortableContext>

                    {/* FLOATING DRAG PREVIEW */}
                    <DragOverlay
                        modifiers={[restrictOverlayToElementsPanel]}
                        dropAnimation={null}
                    >
                        {activeDragItem ? (
                            <div className="element-tree__drag-overlay">
                                <span className="element-tree__field-icon">
                                    <Icon source={activeDragItem.icon} />
                                </span>

                                <span className="element-tree__field-label">
                                    {activeDragItem.label}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
                {/* ADD PAGE BUTTON */}

                <button
                    type="button"
                    className="element-tree__add element-tree__add--page last_add_page"
                    onClick={addPage}
                >
                    <Icon source={PlusCircleIcon} />
                    <span>Add page</span>
                </button>
            </div>

            {/* SHARED FOOTER */}

            <div className="elements-panel__footer">
                <Divider />

                <button
                    type="button"
                    className="elements-panel__header elements-panel__header--clickable"
                    onClick={() => {
                        if (footer) {
                            onSelectElement?.(footer);
                        }
                    }}
                    disabled={!footer}
                >
                    <span className="elements-panel__section-icon">
                        <Icon source={LayoutSectionIcon} />
                    </span>

                    <Text as="span" fontWeight="semibold">
                        Footer
                    </Text>
                </button>
            </div>

        </div>
    );
}

// ======================================================
// 7. INSERTION COMPONENT
// Adds an element between page sections.
// ======================================================
function SidebarSectionInsert({
    pageId,
    rowId,
    placement,
    referenceElementId,
    isPageTop,
    openElementPicker,
}) {
    // Unique ID for each drop zone
    const dropZoneId = isPageTop
        ? `page-top-${pageId}`
        : `row-boundary-${pageId}-${rowId}-${placement}`;

    // Make this section a droppable area
    const { setNodeRef, isOver } = useDroppable({
        id: dropZoneId,
        data: {
            type: isPageTop ? "pageTop" : "rowBoundary",
            pageId,
            rowId,
            placement,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`element-tree__section-insert ${isOver ? "element-tree__section-insert--over" : ""
                }`}
            style={{
                minHeight: isPageTop ? "2px" : "2px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxSizing: "border-box",
            }}
        >
            <span className="element-tree__section-insert-line" />

            <button
                type="button"
                className="element-tree__section-insert-button"
                title="Add element here"
                aria-label="Add element here"
                onPointerDown={(event) =>
                    event.stopPropagation()
                }
                onClick={(event) => {
                    event.stopPropagation();

                    openElementPicker(
                        pageId,
                        rowId ?? null,
                        event,
                        {
                            collection: referenceElementId
                                ? "rootElements"
                                : "rows",
                            placement,
                            referenceElementId:
                                referenceElementId ?? null,
                        }
                    );
                }}
            >
                +
            </button>
        </div>
    );
}

// ======================================================
// 8. SORTABLE PAGE COMPONENT
// Makes a page draggable and renders its contents.
// ======================================================

function SortablePage({
    page,
    togglePage,

    // Drag-and-drop handlers.
    handleFieldDragEnd,
    handleElementDragEnd,

    // Element picker and selection.
    openElementPicker,
    onSelectElement,

    //on seleect page & row
    onSelectPage,
    onSelectRow,

    // Element toolbox actions.
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,

    // Row toolbox actions.
    onToggleRowVisibility,
    onDuplicateRow,
    onDeleteRow,

    // Page toolbox action.
    onDuplicatePage,
}) {
    // Make the complete page draggable.
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `page-${page.id}`,
        data: {
            type: "page",
            pageId: page.id,
            rowId: null,
            label: page.label,
            icon: FileIcon,
        },
    });

    // Allow created elements to be dropped outside rows.
    const {
        setNodeRef: setPageRootDropRef,
        isOver: isPageRootOver,
    } = useDroppable({
        id: `page-root-drop-${page.id}`,
        data: {
            type: "pageRoot",
            pageId: page.id,
            rowId: null,
        },
    });

    const {
        setNodeRef: setPageTopDropRef,
        isOver: isPageTopOver,
    } = useDroppable({
        id: `page-top-drop-${page.id}`,
        data: {
            type: "pageTop",
            pageId: page.id,
            rowId: null,
        },
    });

    // Apply drag styling to the page.
    const pageStyle = {
        // transform: CSS.Transform.toString(transform),
        transition,

        // background: isDragging ? "#FFFFFF" : "transparent",

        // boxShadow: isDragging
        //     ? "0 8px 24px rgba(0, 0, 0, 0.15)"
        //     : "none",

        // border: isDragging
        //     ? "1px solid #E5E7EB"
        //     : "1px solid transparent",

        borderRadius: "10px",
        position: "relative",
        // zIndex: isDragging ? 10 : "auto",
    };

    // Create insertion buttons above or below root elements.
    const renderRootInsertButton = (element, placement) => (
        <button
            type="button"
            className={`element-tree__item-insert ${placement === "before"
                ? "element-tree__item-insert--before"
                : "element-tree__item-insert--after"
                }`}
            title={
                placement === "before"
                    ? "Add element above"
                    : "Add element below"
            }
            aria-label={
                placement === "before"
                    ? "Add element above"
                    : "Add element below"
            }
            onPointerDown={(event) => {
                event.stopPropagation();
            }}
            onClick={(event) => {
                event.stopPropagation();

                openElementPicker(page.id, null, event, {
                    collection: "rootElements",
                    referenceElementId: element.id,
                    placement,
                });
            }}
        />
    );

    // Render one standalone element with insertion controls.
    const renderRootElement = (element) => (
        <div
            key={element.id}
            className="element-tree__item-wrapper"
        >
            {/* INSERT ABOVE */}

            {renderRootInsertButton(element, "before")}

            {/* STANDALONE ELEMENT */}

            <SortableCreatedElement
                element={element}
                type="rootElement"
                rowId={null}
                pageId={page.id}
                onSelectElement={onSelectElement}
                onToggleElementVisibility={onToggleElementVisibility}
                onDuplicateElement={onDuplicateElement}
                onDeleteElement={onDeleteElement}
            />

            {/* INSERT BELOW */}

            {renderRootInsertButton(element, "after")}
        </div>
    );

    const sortableItems = [];

    (page.rows ?? []).forEach((row) => {
        // Standalone elements before this row.
        (page.rootElements ?? [])
            .filter(
                (element) =>
                    String(element.insertBeforeRowId) ===
                    String(row.id)
            )
            .forEach((element) => {
                sortableItems.push(`element-${element.id}`);
            });

        // The row itself.
        sortableItems.push(`row-${row.id}`);

        // Standalone elements after this row.
        (page.rootElements ?? [])
            .filter(
                (element) =>
                    String(element.insertAfterRowId) ===
                    String(row.id)
            )
            .forEach((element) => {
                sortableItems.push(`element-${element.id}`);
            });
    });

    // Normal standalone elements at the bottom.
    (page.rootElements ?? [])
        .filter(
            (element) =>
                element.insertBeforeRowId == null &&
                element.insertAfterRowId == null
        )
        .forEach((element) => {
            sortableItems.push(`element-${element.id}`);
        });
    // insert at the top before first item 
    const hasFirstVisualItem =
        (page.rows ?? []).length > 0 ||
        (page.rootElements ?? []).length > 0;


    return (
        <div
            ref={setNodeRef}
            style={pageStyle}
            className="element-tree__sortable-page"
        >
            {/* PAGE HEADER */}

            <div
                className={`element-tree__page ${page.open ? "element-tree__page--active" : ""
                    }`}
                {...attributes}
                {...listeners}
            >
                {/* EXPAND / COLLAPSE BUTTON */}

                <button
                    type="button"
                    className="element-tree__chevron"
                    onClick={(event) => {
                        event.stopPropagation();
                        togglePage(page.id);
                    }}
                >
                    <Icon
                        source={
                            page.open
                                ? ChevronDownIcon
                                : ChevronRightIcon
                        }
                    />
                </button>

                {/* PAGE ICON AND DRAG HANDLE */}

                <span
                    className="element-tree__field-icon element-tree__page-icon"
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelectPage?.(page);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            event.stopPropagation();
                            onSelectPage?.(page);
                        }
                    }}
                >
                    <span className="element-tree__default-icon">
                        <Icon source={FileIcon} />
                    </span>

                    <span className="element-tree__drag-icon">
                        <Icon source={DragHandleIcon} />
                    </span>
                </span>

                {/* PAGE NAME */}

                <button
                    type="button"
                    className="element-tree__page-toggle"
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelectPage?.(page);
                    }}
                >
                    {page.label}
                </button>

                {/* DUPLICATE PAGE */}

                {page.open && (
                    <button
                        type="button"
                        className="element-tree__action-btn"
                        title="Duplicate page"
                        onPointerDown={(event) =>
                            event.stopPropagation()
                        }
                        onClick={(event) => {
                            event.stopPropagation();
                            onDuplicatePage(page.id);
                        }}
                    >
                        <Icon source={DuplicateIcon} />
                    </button>
                )}
            </div>

            {/* PAGE CONTENT */}

            {page.open && (
                <div
                    ref={setPageRootDropRef}
                    className="element-tree__page-content"
                    style={{
                        minHeight: "80px",
                        width: "calc(100% - 28px)",
                        minWidth: 0,
                        position: "relative",
                        boxSizing: "border-box",
                    }}
                >
                    <SortableContext
                        items={sortableItems}
                        strategy={verticalListSortingStrategy}
                    >
                        {/* INSERT BEFORE THE FIRST ROW */}

                        {hasFirstVisualItem && (
                            <SidebarSectionInsert
                                pageId={page.id}
                                rowId={page.rows?.[0]?.id ?? null}
                                placement="before"
                                isPageTop
                                openElementPicker={openElementPicker}
                            />
                        )}

                        {/* RENDER ROWS AND ROOT ELEMENTS */}

                        {(page.rows || []).map((row) => (
                            <React.Fragment key={row.id}>

                                {/* ROOT ELEMENTS BEFORE THIS ROW */}

                                {(page.rootElements || [])
                                    .filter(
                                        (element) =>
                                            String(element.insertBeforeRowId) ===
                                            String(row.id)
                                    )
                                    .map((element) =>
                                        renderRootElement(element)
                                    )}

                                {/* ROW */}

                                <SortableRow
                                    page={page}
                                    row={row}
                                    pageId={page.id}
                                    handleFieldDragEnd={handleFieldDragEnd}
                                    handleElementDragEnd={handleElementDragEnd}
                                    openElementPicker={openElementPicker}

                                    // Element toolbox actions.
                                    onToggleElementVisibility={onToggleElementVisibility}
                                    onDuplicateElement={onDuplicateElement}
                                    onDeleteElement={onDeleteElement}

                                    // Element selection.
                                    onSelectElement={onSelectElement}

                                    // row selection
                                    onSelectRow={onSelectRow}

                                    // Row toolbox actions.
                                    onToggleRowVisibility={onToggleRowVisibility}
                                    onDuplicateRow={onDuplicateRow}
                                    onDeleteRow={onDeleteRow}
                                />

                                {/* ROOT ELEMENTS AFTER THIS ROW */}

                                {(page.rootElements || [])
                                    .filter(
                                        (element) =>
                                            String(element.insertAfterRowId) ===
                                            String(row.id)
                                    )
                                    .map((element) =>
                                        renderRootElement(element)
                                    )}

                                {/* INSERT BETWEEN ROWS */}

                                <SidebarSectionInsert
                                    pageId={page.id}
                                    rowId={row.id}
                                    placement="after"
                                    openElementPicker={openElementPicker}
                                />

                            </React.Fragment>
                        ))}

                        {/* NORMAL ROOT ELEMENTS */}

                        {(page.rootElements || [])
                            .filter(
                                (element) =>
                                    element.insertBeforeRowId == null &&
                                    element.insertAfterRowId == null
                            )
                            .map((element) =>
                                renderRootElement(element)
                            )}

                    </SortableContext>

                    {/* ADD ELEMENT OUTSIDE ROWS */}

                    <button
                        type="button"
                        className="element-tree__add element-tree__add--root"
                        onClick={(event) => {
                            openElementPicker(
                                page.id,
                                null,
                                event
                            );
                        }}
                    >
                        <Icon source={PlusCircleIcon} />
                        <span>Add elements</span>
                    </button>

                </div>
            )}
        </div>
    );
}

// ======================================================
// 9. SORTABLE ROW COMPONENT
// Makes a complete row draggable and manages its contents.
// ======================================================

function SortableRow({
    page,
    row,
    pageId,

    // Drag-and-drop handlers.
    handleFieldDragEnd,
    handleElementDragEnd,

    // Element picker.
    openElementPicker,

    //row
    onSelectRow,

    // Element toolbox actions.
    onDeleteElement,
    onDuplicateElement,
    onToggleElementVisibility,

    // Row toolbox actions.
    onToggleRowVisibility,
    onSelectElement,
    onDuplicateRow,
    onDeleteRow,
}) {
    // Make the complete row draggable.
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `row-${row.id}`,
        data: {
            type: "row",
            rowId: row.id,
            pageId,
            label: "Row",
            icon: FolderIcon,
        },
    });

    // Allow elements to be dropped inside this row.
    const {
        setNodeRef: setDropRef,
        isOver,
    } = useDroppable({
        id: `row-drop-${row.id}`,
        data: {
            rowId: row.id,
            type: "rowDrop",
            pageId,
        },
    });

    // Apply drag styling to the row.
    const rowStyle = {
        transform: CSS.Transform.toString(transform),
        transition,

        background: isDragging ? "#FFFFFF" : "transparent",

        boxShadow: isDragging
            ? "0 6px 18px rgba(0, 0, 0, 0.12)"
            : "none",

        border: isDragging
            ? "1px solid #E5E7EB"
            : "1px solid transparent",

        borderRadius: "8px",
        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };

    // Track row heading hover for the toolbox.
    const [isHovered, setIsHovered] = useState(false);

    // Get the row's fields and created elements.
    const fields = row.fields || [];
    const elements = row.elements || [];

    // Create insertion buttons around fields and elements.
    const renderInsertButton = (
        collection,
        elementId,
        placement
    ) => (
        <button
            type="button"
            className={`element-tree__item-insert ${placement === "before"
                ? "element-tree__item-insert--before"
                : "element-tree__item-insert--after"
                }`}
            title={
                placement === "before"
                    ? "Add element above"
                    : "Add element below"
            }
            aria-label={
                placement === "before"
                    ? "Add element above"
                    : "Add element below"
            }
            onPointerDown={(event) => {
                event.stopPropagation();
            }}
            onClick={(event) => {
                event.stopPropagation();

                openElementPicker(
                    pageId,
                    row.id,
                    event,
                    {
                        collection,
                        elementId,
                        placement,
                    }
                );
            }}
        />
    );

    return (
        <div
            ref={setNodeRef}
            data-element-tree-row="true"
            data-page-id={pageId}
            data-row-id={row.id}
            style={rowStyle}
            className={`element-tree__row ${row.visible === false
                ? "element-tree__row--hidden"
                : ""
                }`}
        >
            {/* ROW HEADING AND DRAG HANDLE */}

            <div
                className="element-tree__row-heading"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                {...attributes}
                {...listeners}
            >
                {/* FOLDER ICON / DRAG ICON */}

                <span
                    className="element-tree__field-icon element-tree__row-drag-icon"
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelectRow?.(pageId, row);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            event.stopPropagation();
                            onSelectRow?.(pageId, row);
                        }
                    }}
                >
                    {/* ROW ICON */}

                    <span className="element-tree__default-icon">
                        <Icon
                            source={
                                row.icon
                                    ? PolarisIcons[row.icon] || FolderIcon
                                    : FolderIcon
                            }
                        />
                    </span>

                    {/* DRAG HANDLE */}

                    <span className="element-tree__drag-icon">
                        <Icon source={DragHandleIcon} />
                    </span>
                </span>

                {/* ROW LABEL */}
                {/* ROW LABEL */}

                <span
                    className="element-tree__row-label"
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelectRow?.(pageId, row);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            event.stopPropagation();
                            onSelectRow?.(pageId, row);
                        }
                    }}
                >
                    <Text as="span" variant="bodySm">
                        {row.label || "Row"}
                    </Text>
                </span>

                {/* ROW TOOLBOX */}

                <ElementActions
                    element={row}
                    onToggleElementVisibility={(row) =>
                        onToggleRowVisibility(pageId, row.id)
                    }
                    onDuplicateElement={(row) =>
                        onDuplicateRow(pageId, row.id)
                    }
                    onDeleteElement={(row) =>
                        onDeleteRow(pageId, row.id)
                    }
                />
            </div>

            {/* ROW FIELDS AND CREATED ELEMENTS */}
            <div
                ref={setDropRef}
                className={`element-tree__row-fields ${isOver
                    ? "element-tree__row-fields--over"
                    : ""
                    }`}
            >
                {(() => {
                    // Combine fields and created elements.
                    const combinedItems = [
                        ...fields.map((field, index) => ({
                            item: field,
                            collection: "fields",
                            dragId: getDragItemId(field, index),
                        })),

                        ...elements.map((element) => ({
                            item: element,
                            collection: "elements",
                            dragId: `element-${element.id}`,
                        })),
                    ];
                    const savedOrder = row.itemOrder || [];

                    combinedItems.sort((a, b) => {
                        const indexA = savedOrder.indexOf(a.dragId);
                        const indexB = savedOrder.indexOf(b.dragId);

                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;

                        return indexA - indexB;
                    });

                    return (
                        <SortableContext
                            items={combinedItems.map(
                                (entry) => entry.dragId
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            {combinedItems.map((entry) => {
                                const {
                                    item,
                                    collection,
                                    dragId,
                                } = entry;

                                return (
                                    <div
                                        key={dragId}
                                        className="element-tree__item-wrapper"
                                    >
                                        {renderInsertButton(
                                            collection,
                                            item.id,
                                            "before"
                                        )}

                                        {collection === "fields" ? (
                                            <SortableSidebarField
                                                id={dragId}
                                                field={item}
                                                rowId={row.id}
                                                pageId={pageId}
                                                onSelectElement={onSelectElement}
                                                onToggleElementVisibility={onToggleElementVisibility}
                                                onDuplicateElement={onDuplicateElement}
                                                onDeleteElement={onDeleteElement}
                                            />
                                        ) : (
                                            <SortableCreatedElement
                                                element={item}
                                                type="element"
                                                rowId={row.id}
                                                pageId={pageId}
                                                onSelectElement={onSelectElement}
                                                onToggleElementVisibility={onToggleElementVisibility}
                                                onDuplicateElement={onDuplicateElement}
                                                onDeleteElement={onDeleteElement}
                                            />
                                        )}

                                        {renderInsertButton(
                                            collection,
                                            item.id,
                                            "after"
                                        )}
                                    </div>
                                );
                            })}
                        </SortableContext>
                    );
                })()}
            </div>


            {/* ADD ELEMENT TO THIS ROW */}

            <button
                type="button"
                className="element-tree__add"
                onClick={(event) => {
                    openElementPicker(
                        pageId,
                        row.id,
                        event
                    );
                }}
            >
                <Icon source={PlusCircleIcon} />
                <span>Add elements</span>
            </button>
        </div>
    );
}

// ======================================================
// 10. SORTABLE SIDEBAR FIELD COMPONENT
// Makes original template fields draggable.
// ======================================================

function SortableSidebarField({
    id,
    field,
    rowId,
    pageId,

    // Element toolbox actions.
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,

    // Element selection.
    onSelectElement,
}) {
    // Track hover to show the field toolbox.
    const [isHovered, setIsHovered] = useState(false);

    // Make the field draggable.
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        data: {
            type: "field",
            rowId,
            pageId,
            itemId: id,

            label:
                typeof field === "string"
                    ? field
                    : field?.label ||
                    field?.type ||
                    "Untitled field",

            icon: getElementIcon(
                typeof field === "string"
                    ? field
                    : field?.type
            ),
        },
    });

    // Apply drag styling to the field.
    const style = {
        transform: isDragging
            ? "none"
            : CSS.Transform.toString(transform),
        transition,

        background: isDragging ? "#FFFFFF" : "transparent",

        boxShadow: isDragging
            ? "0 5px 15px rgba(0, 0, 0, 0.14)"
            : "none",

        border: isDragging
            ? "1px solid #E5E7EB"
            : "1px solid transparent",

        borderRadius: "8px",
        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };

    // Get the actual field ID for toolbox actions.
    const fieldId = field?.id;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                cursor: "pointer",
            }}
            className={`element-tree__field element-tree__field--draggable ${field?.visible === false
                ? "element-tree__field--hidden"
                : ""
                }`}
            {...attributes}
            {...listeners}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
                if (
                    typeof field === "object" &&
                    field?.id != null
                ) {
                    onSelectElement?.(field);
                }
            }}
        >
            {/* FIELD ICON AND DRAG HANDLE */}

            <span className="element-tree__field-icon">
                <span className="element-tree__default-icon">
                    <Icon
                        source={getElementIcon(
                            typeof field === "string"
                                ? field === "First Name" ||
                                    field === "Last Name"
                                    ? "name"
                                    : field
                                : field?.type === "first_name" ||
                                    field?.type === "last_name"
                                    ? "name"
                                    : field?.type
                        )}
                    />
                </span>

                <span className="element-tree__drag-icon">
                    <Icon source={DragHandleIcon} />
                </span>
            </span>

            {/* FIELD LABEL */}

            <span className="element-tree__field-label">
                {typeof field === "string"
                    ? field
                    : field?.label ||
                    field?.type ||
                    "Untitled field"}
            </span>

            {/* TOOLBOX: Only fields with IDs support these actions. */}

            <ElementActions
                element={field}
                onToggleElementVisibility={onToggleElementVisibility}
                onDuplicateElement={onDuplicateElement}
                onDeleteElement={onDeleteElement}
            />
        </div>
    );
}

// ======================================================
// 11. SORTABLE CREATED ELEMENT COMPONENT
// Makes newly created elements draggable.
// ======================================================

function SortableCreatedElement({
    element,
    type = "element",
    rowId = null,
    pageId,

    // Element toolbox actions.
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,

    // Element selection.
    onSelectElement,
}) {
    // Track hover to show the element toolbox.
    const [isHovered, setIsHovered] = useState(false);

    // Make the created element draggable.
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `element-${element.id}`,
        data: {
            type,
            rowId,
            pageId,
            itemId: `element-${element.id}`,
            label:
                element.label ||
                element.type ||
                "Untitled element",
            icon: getElementIcon(element.type),
        },
    });

    // Apply drag styling to the element.
    const style = {
        transform: isDragging
            ? "none"
            : CSS.Transform.toString(transform),
        transition,

        background: isDragging ? "#FFFFFF" : "transparent",

        boxShadow: isDragging
            ? "0 5px 15px rgba(0, 0, 0, 0.14)"
            : "none",

        border: isDragging
            ? "1px solid #E5E7EB"
            : "1px solid transparent",

        borderRadius: "8px",
        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                cursor: "pointer",
            }}
            className={`element-tree__field element-tree__field--draggable ${element.visible === false
                ? "element-tree__field--hidden"
                : ""
                }`}
            {...attributes}
            {...listeners}
            onClick={() =>
                onSelectElement?.(element)
            }
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ELEMENT ICON AND DRAG HANDLE */}

            <span className="element-tree__field-icon">
                <span className="element-tree__default-icon">
                    <Icon
                        source={getElementIcon(
                            typeof element === "string"
                                ? element
                                : element.type
                        )}
                    />
                </span>

                <span className="element-tree__drag-icon">
                    <Icon source={DragHandleIcon} />
                </span>
            </span>

            {/* ELEMENT LABEL */}

            <span className="element-tree__field-label">
                {element.label ||
                    element.type ||
                    "Untitled element"}
            </span>

            {/* ELEMENT TOOLBOX */}

            <ElementActions
                element={element}
                onToggleElementVisibility={onToggleElementVisibility}
                onDuplicateElement={onDuplicateElement}
                onDeleteElement={onDeleteElement}
            />
        </div>
    );
}
