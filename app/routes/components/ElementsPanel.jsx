
import React, { useState } from "react";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    DragOverlay,
} from "@dnd-kit/core";

import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
    Divider,
    Text,
    Icon,
    Modal,
    Button,
    InlineGrid,
    BlockStack,
    InlineStack
} from "@shopify/polaris";

import { ELEMENT_TYPES } from "../../utils/elementsConfig.js";

// Import the create element config helper.
import { createElementConfig } from "../../utils/elementHelpers.js";

import "../../ElementsPanel.css";
// import ElementPickerPopover from "./ElementPickerPopover.jsx";
import ElementActions from "./ElementActions.jsx";

import {
    PlusCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    FileIcon,
    FolderIcon,
    LayoutSectionIcon,
    DuplicateIcon
} from "@shopify/polaris-icons";


//helper 
// Get the actual Polaris icon for an element based on its type.
const getElementIcon = (type) => {
    const elementConfig = ELEMENT_TYPES.find(
        (item) => item.type === type
    );

    // If no matching icon is found, use FileIcon as the fallback.
    return elementConfig?.icon || FileIcon;
};

// ======================================================
// MAIN COMPONENT
// Manages pages and provides drag-and-drop handlers.
// ======================================================

export default function ElementsPanel({
    pages,
    setPages,
    // elementPickerOpen,
    // setElementPickerOpen,
    // elementTarget,
    // setElementTarget,
    // elementPickerPosition,
    // setElementPickerPosition,

    // Element toolbox actions from FormEditor
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,
    openElementPicker,
    onToggleRowVisibility,
    onDuplicateRow,
    onDeleteRow,
    onDuplicatePage,
}) {
    //state to store the drag item data 
    const [activeDragItem, setActiveDragItem] = useState(null);

    // Configure the pointer sensor.
    // The user must move the pointer 5px before dragging starts.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // ======================================================
    // FUNCTION: REORDER ELEMENTS INSIDE THE ROWS AND ROOT ELEMENTS
    // ======================================================

    const handlePageContentDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) return;

        // Keep row reordering separate
        if (activeData.type === "row") {
            return;
        }

        const targetRowId = overData.rowId ?? null;
        const targetPageId = overData.pageId;

        if (targetPageId == null) return;

        setPages((previousPages) => {
            let draggedItem = null;

            // First remove the dragged item from its original page
            const updatedPages = previousPages.map((page) => {

                // Only remove the item from its actual source page.
                if (page.id !== activeData.pageId) return page;

                const rows = (page.rows || []).map((row) => ({
                    ...row,
                    fields: [...(row.fields || [])],
                    elements: [...(row.elements || [])],
                }));

                if (activeData.type === "field") {
                    const sourceRow = rows.find(
                        (row) => row.id === activeData.rowId
                    );

                    if (sourceRow) {
                        draggedItem = sourceRow.fields.find(
                            (item, index) =>
                                getDragItemId(item, index) === activeData.itemId
                        );

                        sourceRow.fields = sourceRow.fields.filter(
                            (item, index) =>
                                getDragItemId(item, index) !== activeData.itemId
                        );
                    }
                }

                if (activeData.type === "element") {
                    const sourceRow = rows.find(
                        (row) => row.id === activeData.rowId
                    );

                    if (sourceRow) {
                        draggedItem = sourceRow.elements.find(
                            (item) => `element-${item.id}` === activeData.itemId
                        );

                        sourceRow.elements = sourceRow.elements.filter(
                            (item) => `element-${item.id}` !== activeData.itemId
                        );
                    }
                }

                if (activeData.type === "rootElement") {
                    draggedItem = (page.rootElements || []).find(
                        (item) => `element-${item.id}` === activeData.itemId
                    );
                }

                return {
                    ...page,
                    rows,
                    rootElements: (page.rootElements || []).filter(
                        (item) =>
                            activeData.type !== "rootElement" ||
                            `element-${item.id}` !== activeData.itemId
                    ),
                };
            });

            if (!draggedItem) return previousPages;

            // Then add the item to the target page and row
            return updatedPages.map((page) => {
                if (page.id !== targetPageId) return page;

                // If the target is a page header, add the item to root elements.
                if (targetRowId == null) {
                    return {
                        ...page,
                        rootElements: [
                            ...(page.rootElements || []),
                            draggedItem,
                        ],
                    };
                }

                return {
                    ...page,
                    rows: page.rows.map((row) => {
                        if (row.id !== targetRowId) return row;

                        if (activeData.type === "field") {
                            return {
                                ...row,
                                fields: [...row.fields, draggedItem],
                            };
                        }

                        return {
                            ...row,
                            elements: [...row.elements, draggedItem],
                        };
                    }),
                };
            });
        });
    };

    // ======================================================
    // FUNCTION: REORDER PAGES
    // Moves the dragged page to the position of the target.
    // ======================================================

    // ======================================================
    // FUNCTION: REORDER PAGES
    // Moves the dragged page to the position of the target.
    // ======================================================

    const handlePageDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        // Get actual page IDs from drag data.
        const activePageId = active.data.current?.pageId;
        const overPageId = over.data.current?.pageId;

        if (
            activePageId == null ||
            overPageId == null ||
            activePageId === overPageId
        ) {
            return;
        }

        setPages((previousPages) => {
            // Find the original position of the dragged page.
            const oldIndex = previousPages.findIndex(
                (page) => page.id === activePageId
            );

            // Find the position where the page was dropped.
            const newIndex = previousPages.findIndex(
                (page) => page.id === overPageId
            );

            if (oldIndex === -1 || newIndex === -1) {
                return previousPages;
            }

            // Move the complete page to its new position.
            return arrayMove(previousPages, oldIndex, newIndex);
        });
    };
    // ======================================================
    // FUNCTION: REORDER ROWS
    // Moves a row within its own page.
    // ======================================================

    // ======================================================
    // FUNCTION: REORDER ROWS
    // Moves a row within its own page.
    // ======================================================

    const handleRowDragEnd = (event, pageId) => {
        const { active, over } = event;

        if (!over) return;

        // Get the actual row IDs from the drag data.
        const activeRowId = active.data.current?.rowId;
        const overRowId = over.data.current?.rowId;

        // Stop if either row ID is missing or the row is dropped
        // back onto its original position.
        if (
            activeRowId == null ||
            overRowId == null ||
            activeRowId === overRowId
        ) {
            return;
        }

        setPages((previousPages) =>
            previousPages.map((page) => {
                // Only update the page containing the dragged row.
                if (page.id !== pageId) return page;

                // Find the original position of the dragged row.
                const oldIndex = page.rows.findIndex(
                    (row) => row.id === activeRowId
                );

                // Find the position where the row was dropped.
                const newIndex = page.rows.findIndex(
                    (row) => row.id === overRowId
                );

                if (oldIndex === -1 || newIndex === -1) {
                    return page;
                }

                // Move the complete row to its new position.
                return {
                    ...page,
                    rows: arrayMove(page.rows, oldIndex, newIndex),
                };
            })
        );
    };

    // ======================================================
    // FUNCTION: REORDER FIELDS
    // Moves a field within its own row.
    // ======================================================

    const handleFieldDragEnd = (event, pageId, rowId) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setPages((previousPages) =>
            previousPages.map((page) => {
                if (page.id !== pageId) return page;

                return {
                    ...page,
                    rows: (page.rows || []).map((row) => {
                        if (row.id !== rowId) return row;

                        const getFieldId = (field, index) =>
                            typeof field === "object" && field?.id != null
                                ? `field-${field.id}`
                                : `${rowId}-field-${index}`;

                        const oldIndex = row.fields.findIndex(
                            (field, index) =>
                                getFieldId(field, index) === active.id
                        );

                        const newIndex = row.fields.findIndex(
                            (field, index) =>
                                getFieldId(field, index) === over.id
                        );

                        if (oldIndex === -1 || newIndex === -1) {
                            return row;
                        }

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
    // FUNCTION: REORDER CREATED ELEMENTS
    // Reorders elements either inside a row or outside rows.
    // ======================================================

    const handleElementDragEnd = (event, pageId, rowId = null) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setPages((previousPages) =>
            previousPages.map((page) => {
                if (page.id !== pageId) return page;

                // CASE 1: Element belongs inside a row.
                if (rowId !== null) {
                    return {
                        ...page,
                        rows: page.rows.map((row) => {
                            if (row.id !== rowId) return row;

                            const oldIndex = (row.elements || []).findIndex(
                                (element) => `element-${element.id}` === active.id
                            );

                            const newIndex = (row.elements || []).findIndex(
                                (element) => `element-${element.id}` === over.id
                            );

                            if (oldIndex === -1 || newIndex === -1) {
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

                // CASE 2: Element belongs directly to the page.
                const rootElements = page.rootElements || [];

                const oldIndex = rootElements.findIndex(
                    (element) => `element-${element.id}` === active.id
                );

                const newIndex = rootElements.findIndex(
                    (element) => `element-${element.id}` === over.id
                );

                if (oldIndex === -1 || newIndex === -1) {
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
    // FUNCTION: HANDLE ALL DRAG END EVENTS
    // Determines whether a page, row, or element was dragged.
    // ======================================================

    const handleAllDragEnd = (event) => {
        const activeData = event.active.data.current;

        if (!activeData) return;

        if (activeData.type === "page") {
            handlePageDragEnd(event);
            return;
        }

        if (activeData.type === "row") {
            handleRowDragEnd(event, activeData.pageId);
            return;
        }

        handlePageContentDragEnd(event);
    };

    // ======================================================
    // FUNCTION: ADD A PAGE
    // Adds a new page and closes the previously open pages.
    // ======================================================

    const addPage = () => {
        setPages((previousPages) => [
            ...previousPages.map((page) => ({
                ...page,
                open: false,
            })),

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
    // FUNCTION: TOGGLE A PAGE
    // Opens the selected page and closes the others.
    // ======================================================

    const togglePage = (pageId) => {
        setPages((previousPages) =>
            previousPages.map((page) => ({
                ...page,
                open: page.id === pageId ? !page.open : false,
            }))
        );
    };

    // ======================================================
    // FUNCTION: ADD ELEMENT TO A ROW
    // Adds a new element to the selected row.
    // ======================================================

    const addRowElement = (pageId, rowId, item) => {
        if (!item?.type) return;

        const newElement = createElementConfig(item);

        setPages((previousPages) =>
            previousPages.map((page) =>
                page.id !== pageId
                    ? page
                    : {
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
                    }
            )
        );
    };

    // ======================================================
    // FUNCTION: ADD ROOT ELEMENT
    // Opens the picker to add an element directly to the page.
    // ======================================================

    const addRootElement = (pageId) => {
        openElementPicker(pageId);
    };

    // ======================================================
    // RENDER THE ELEMENTS PANEL actual content
    // ======================================================

    return (
        <div className="elements-panel">

            {/* HEADER SECTION */}

            <div className="elements-panel__header">
                <span className="elements-panel__section-icon">
                    <Icon source={LayoutSectionIcon} />
                </span>

                <Text as="span" fontWeight="semibold">
                    Header
                </Text>
            </div>

            <Divider />

            {/* ELEMENTS HEADING */}

            <div className="elements-panel__section-title">
                <Text as="span" variant="bodySm" tone="subdued">
                    Elements
                </Text>
            </div>

            {/* PAGES LIST */}

            <div className="element-tree">

                {/* SHARED DRAG AND DROP CONTEXT */}

                <DndContext
                    sensors={sensors}

                    collisionDetection={(args) => {
                        const activeType = args.active.data.current?.type;

                        if (activeType === "page") {
                            const pageContainers = args.droppableContainers.filter(
                                (container) => container.data.current?.type === "page"
                            );

                            return closestCenter({
                                ...args,
                                droppableContainers: pageContainers,
                            });
                        }

                        if (activeType === "row") {
                            const rowContainers = args.droppableContainers.filter(
                                (container) => container.data.current?.type === "row"
                            );

                            return closestCenter({
                                ...args,
                                droppableContainers: rowContainers,
                            });
                        }

                        return closestCenter(args);
                    }}

                    // NEW: Store the item being dragged.
                    onDragStart={(event) => {
                        const data = event.active.data.current;

                        setActiveDragItem({
                            label: data?.label || "Element",
                            icon: data?.icon || FileIcon,
                            type: data?.type,
                        });
                    }}

                    // Existing drop logic remains unchanged.
                    onDragEnd={(event) => {
                        handleAllDragEnd(event);
                        setActiveDragItem(null);
                    }}

                    // NEW: Clear overlay if dragging is cancelled.
                    onDragCancel={() => {
                        setActiveDragItem(null);
                    }}
                >
                    <SortableContext
                        items={pages.map((page) => `page-${page.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        {/* Render each page as a draggable component. */}

                        {pages.map((page) => (
                            <SortablePage
                                key={page.id}
                                page={page}
                                sensors={sensors}
                                togglePage={togglePage}
                                handleRowDragEnd={handleRowDragEnd}
                                handleFieldDragEnd={handleFieldDragEnd}
                                handlePageContentDragEnd={handlePageContentDragEnd}
                                handleElementDragEnd={handleElementDragEnd}
                                addRowElement={addRowElement}
                                addRootElement={addRootElement}
                                openElementPicker={openElementPicker}

                                // Element toolbox actions from FormEditor
                                onToggleElementVisibility={onToggleElementVisibility}
                                onDuplicateElement={onDuplicateElement}
                                onDeleteElement={onDeleteElement}
                                // NEW: Row toolbox actions
                                onToggleRowVisibility={onToggleRowVisibility}
                                onDuplicateRow={onDuplicateRow}
                                onDeleteRow={onDeleteRow}

                                // NEW: Page toolbox action
                                onDuplicatePage={onDuplicatePage}
                            />
                        ))}
                    </SortableContext>
                    {/* Floating drag card */}
                    <DragOverlay>
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

            {/* FOOTER SECTION */}

            <div className="elements-panel__footer">
                <Divider />

                <div className="elements-panel__header">
                    <span className="elements-panel__section-icon">
                        <Icon source={LayoutSectionIcon} />
                    </span>

                    <Text as="span" fontWeight="semibold">
                        Footer
                    </Text>
                </div>
            </div>

            {/* ELEMENT PICKER MODAL */}

            {/* <ElementPickerPopover
                open={elementPickerOpen}
                position={elementPickerPosition}
                onClose={() => {
                    setElementPickerOpen(false);
                    setElementTarget(null);
                }}
                onSelect={handleSelectElement}
            /> */}

        </div>
    );
}

// ======================================================
// HELPER: GET DRAG ITEM ID
// Returns the correct drag ID for fields.
// ======================================================

const getDragItemId = (item, index) => {
    return typeof item === "object" && item?.id != null
        ? `field-${item.id}`
        : `field-index-${index}`;
};

// ======================================================
// COMPONENT: SORTABLE PAGE
// Makes the page draggable using its drag handle.
// Its rows and elements remain inside the page.
// ======================================================

function SortablePage({
    page,
    sensors,
    togglePage,
    handleRowDragEnd,
    handleFieldDragEnd,
    handleElementDragEnd,
    handlePageContentDragEnd,
    addRowElement,
    addRootElement,
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,
    openElementPicker,
    // NEW: Row toolbox actions
    onToggleRowVisibility,
    onDuplicateRow,
    onDeleteRow,

    // NEW: Page toolbox action
    onDuplicatePage,
}) {
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

    // Apply the drag position and visual feedback.
    const pageStyle = {
        transform: CSS.Transform.toString(transform),
        transition,

        // Floating card effect while dragging
        background: isDragging ? "#FFFFFF" : "transparent",
        boxShadow: isDragging
            ? "0 8px 24px rgba(0, 0, 0, 0.15)"
            : "none",

        border: isDragging ? "1px solid #E5E7EB" : "1px solid transparent",
        borderRadius: "10px",

        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };
    //hover
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
                {/* Expand/collapse arrow */}

                <button
                    type="button"
                    className="element-tree__chevron"
                    onClick={() => togglePage(page.id)}
                >
                    <Icon
                        source={page.open ? ChevronDownIcon : ChevronRightIcon}
                    />
                </button>

                {/* Page icon changes to drag icon on hover */}

                <span
                    className="element-tree__field-icon element-tree__page-icon"

                >
                    <span className="element-tree__default-icon">
                        <Icon source={FileIcon} />
                    </span>

                    <span className="element-tree__drag-icon">⠿</span>
                </span>

                {/* Page name */}

                <button
                    type="button"
                    className="element-tree__page-toggle"
                    onClick={() => togglePage(page.id)}
                >
                    {page.label}
                </button>

                {/* Duplicate button is always visible when page is open */}

                {page.open && (
                    <button
                        type="button"
                        className="element-tree__action-btn"
                        title="Duplicate page"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation();
                            onDuplicatePage(page.id);
                        }}
                    >
                        <Icon source={DuplicateIcon} />
                    </button>
                )}
            </div>

            {/* PAGE CONTENT
            Rows and root elements are shown only when open. */}

            {page.open && (
                <>
                    <div className="element-tree__page-content">

                        {/* ROWS LIST */}

                        <SortableContext
                            items={(page.rows || []).map(
                                (row) => `row-${row.id}`
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            {(page.rows || []).map((row) => (
                                <SortableRow
                                    key={row.id}
                                    row={row}
                                    pageId={page.id}
                                    sensors={sensors}
                                    handleFieldDragEnd={handleFieldDragEnd}
                                    handleElementDragEnd={handleElementDragEnd}
                                    addRowElement={addRowElement}
                                    openElementPicker={openElementPicker}
                                    onToggleElementVisibility={onToggleElementVisibility}
                                    onDuplicateElement={onDuplicateElement}
                                    onDeleteElement={onDeleteElement}
                                    // NEW: Row toolbox actions
                                    onToggleRowVisibility={onToggleRowVisibility}
                                    onDuplicateRow={onDuplicateRow}
                                    onDeleteRow={onDeleteRow}
                                />
                            ))}
                        </SortableContext>

                        {/* ROOT ELEMENTS LIST */}

                        <SortableContext
                            items={(page.rootElements || []).map(
                                (element) => `element-${element.id}`
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            {(page.rootElements || []).map((element) => (
                                <SortableCreatedElement
                                    key={element.id}
                                    element={element}
                                    type="rootElement"
                                    rowId={null}
                                    pageId={page.id}

                                    // Pass toolbox handlers to root elements.
                                    onToggleElementVisibility={onToggleElementVisibility}
                                    onDuplicateElement={onDuplicateElement}
                                    onDeleteElement={onDeleteElement}
                                />
                            ))}
                        </SortableContext>

                        {/* ADD ELEMENT OUTSIDE ROWS */}

                        <button
                            type="button"
                            className="element-tree__add element-tree__add--root"
                            onClick={(event) => {
                                openElementPicker(page.id, null, event);
                            }}
                        >
                            <Icon source={PlusCircleIcon} />
                            <span>Add elements</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ======================================================
// COMPONENT: SORTABLE ROW
// Makes a complete row draggable using its row handle.
// The fields and elements move together with their row.
// ======================================================


function SortableRow({
    page,
    row,
    pageId,
    sensors,
    handleFieldDragEnd,
    handleElementDragEnd,
    addRowElement,
    openElementPicker,
    onDeleteElement,
    onDuplicateElement,
    onToggleElementVisibility,
    // NEW: Row toolbox actions
    onToggleRowVisibility,
    onDuplicateRow,
    onDeleteRow,
}) {
    // useSortable for the row itself.
    // Allows you to drag and reorder the row.
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

    // useDroppable allows you to drop elements inside the row.
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

    // Apply the drag position and visual feedback.
    const rowStyle = {
        transform: CSS.Transform.toString(transform),
        transition,

        background: isDragging ? "#FFFFFF" : "transparent",
        boxShadow: isDragging
            ? "0 6px 18px rgba(0, 0, 0, 0.12)"
            : "none",

        border: isDragging ? "1px solid #E5E7EB" : "1px solid transparent",
        borderRadius: "8px",

        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };

    // state to show hover 
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            ref={setNodeRef}
            style={rowStyle}
            className="element-tree__row"
        >
            {/* ROW HEADING AND DRAG HANDLE */}

            <div
                className="element-tree__row-heading"
                // add these to get knonw mouse enter 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}

                // Make the entire row heading draggable.
                {...attributes}
                {...listeners}
            >
                {/* Folder icon changes to drag icon on hover */}

                <span className="element-tree__field-icon element-tree__row-drag-icon">
                    <span className="element-tree__default-icon">
                        <Icon source={FolderIcon} />
                    </span>

                    <span className="element-tree__drag-icon">⠿</span>
                </span>

                {/* Row label */}

                <Text as="span" variant="bodySm">
                    Row
                </Text>

                {/* Reusable row toolbox */}
                {isHovered && (
                    <ElementActions
                        element={row}
                        onToggleElementVisibility={() => onToggleRowVisibility(pageId, row.id)}
                        onDuplicateElement={() => onDuplicateRow(pageId, row.id)}
                        onDeleteElement={() => onDeleteRow(pageId, row.id)}
                    />
                )}
            </div>

            {/* ROW FIELDS AND CREATED ELEMENTS */}

            <div
                ref={setDropRef}
                className={`element-tree__row-fields ${isOver ? "element-tree__row-fields--over" : ""
                    }`}
            >
                <SortableContext
                    items={[
                        ...(row.fields || []).map((field, index) =>
                            getDragItemId(field, index)
                        ),

                        ...(row.elements || []).map(
                            (element) => `element-${element.id}`
                        ),
                    ]}
                    strategy={verticalListSortingStrategy}
                >
                    {/* ORIGINAL FIELDS */}

                    {(row.fields || []).map((field, index) => {
                        const fieldId = getDragItemId(field, index);

                        return (
                            <SortableSidebarField
                                key={fieldId}
                                id={fieldId}
                                field={field}
                                rowId={row.id}
                                pageId={pageId}
                                onToggleElementVisibility={onToggleElementVisibility}
                                onDuplicateElement={onDuplicateElement}
                                onDeleteElement={onDeleteElement}
                            />
                        );
                    })}

                    {/* CREATED ELEMENTS */}

                    {(row.elements || []).map((element) => (
                        <SortableCreatedElement
                            key={element.id}
                            element={element}
                            type="element"
                            rowId={row.id}
                            pageId={pageId}

                            // Pass toolbox handlers to row elements.
                            onToggleElementVisibility={onToggleElementVisibility}
                            onDuplicateElement={onDuplicateElement}
                            onDeleteElement={onDeleteElement}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* ADD ELEMENT TO THIS ROW */}

            <button
                type="button"
                className="element-tree__add"
                onClick={(event) => {
                    openElementPicker(pageId, row.id, event);
                }}
            >
                <Icon source={PlusCircleIcon} />
                <span>Add elements</span>
            </button>
        </div>
    );
}


// ======================================================
// COMPONENT: SORTABLE SIDEBAR FIELD
// Makes an original field draggable.
// Shows the drag icon instead of the file icon on hover.
// ======================================================

function SortableSidebarField({
    id,
    field,
    rowId,
    pageId,
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,
}) {
    // State to handle the hover.
    const [isHovered, setIsHovered] = useState(false);

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
            label: typeof field === "string"
                ? field
                : field?.label || field?.type || "Untitled field",
            icon: getElementIcon(
                typeof field === "string" ? field : field?.type
            ),
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,

        background: isDragging ? "#FFFFFF" : "transparent",
        boxShadow: isDragging
            ? "0 5px 15px rgba(0, 0, 0, 0.14)"
            : "none",

        border: isDragging ? "1px solid #E5E7EB" : "1px solid transparent",
        borderRadius: "8px",

        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };

    // Get the actual field ID, not the sortable drag ID.
    const fieldId = field?.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="element-tree__field element-tree__field--draggable"
            {...attributes}
            {...listeners}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="element-tree__field-icon">
                <span className="element-tree__default-icon">
                    <Icon
                        source={getElementIcon(
                            typeof field === "string"
                                ? field === "First Name" || field === "Last Name"
                                    ? "name"
                                    : field
                                : field?.type === "first_name" || field?.type === "last_name"
                                    ? "name"
                                    : field?.type
                        )}
                    />
                </span>

                <span className="element-tree__drag-icon">⠿</span>
            </span>

            <span className="element-tree__field-label">
                {typeof field === "string"
                    ? field
                    : field?.label || field?.type || "Untitled field"}
            </span>

            {/* Show reusable toolbox only when hovering.
                Original string fields have no ID, so they cannot use ID-based actions. */}

            {isHovered && fieldId != null && (
                <ElementActions
                    element={field}
                    onToggleElementVisibility={onToggleElementVisibility}
                    onDuplicateElement={onDuplicateElement}
                    onDeleteElement={onDeleteElement}
                />
            )}
        </div>
    );
}

// ======================================================
// COMPONENT: SORTABLE CREATED ELEMENT
// Makes an element created by Add elements draggable.
// ======================================================

function SortableCreatedElement({
    element,
    type = "element",
    rowId = null,
    pageId,
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,
}) {
    // State to handle the hover.
    const [isHovered, setIsHovered] = useState(false);

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
            label: element.label || element.type || "Untitled element",
            icon: getElementIcon(element.type),
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,

        background: isDragging ? "#FFFFFF" : "transparent",
        boxShadow: isDragging
            ? "0 5px 15px rgba(0, 0, 0, 0.14)"
            : "none",

        border: isDragging ? "1px solid #E5E7EB" : "1px solid transparent",
        borderRadius: "8px",

        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="element-tree__field element-tree__field--draggable"
            {...attributes}
            {...listeners}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="element-tree__field-icon">
                <span className="element-tree__default-icon">
                    <Icon source={getElementIcon(element.type)} />
                </span>

                <span className="element-tree__drag-icon">⠿</span>
            </span>

            <span className="element-tree__field-label">
                {element.label || element.type || "Untitled element"}
            </span>

            {/* Show reusable toolbox only when hovering */}

            {isHovered && element?.id != null && (
                <ElementActions
                    element={element}
                    onToggleElementVisibility={onToggleElementVisibility}
                    onDuplicateElement={onDuplicateElement}
                    onDeleteElement={onDeleteElement}
                />
            )}
        </div>
    );
}
