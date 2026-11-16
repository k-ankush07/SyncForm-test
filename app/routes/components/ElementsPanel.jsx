
import React, { useState } from "react";

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

import "../../ElementsPanel.css";

// ======================================================
// 4. HELPER FUNCTIONS
// ======================================================

// Get the Polaris icon associated with an element type.
const getElementIcon = (type) => {
    const elementConfig = ELEMENT_TYPES.find(
        (item) => item.type === type
    );

    // Use FileIcon if no matching icon exists.
    return elementConfig?.icon || FileIcon;
};

// Get the unique drag ID for a field.
const getDragItemId = (item, index) => {
    return typeof item === "object" && item?.id != null
        ? `field-${item.id}`
        : `field-index-${index}`;
};

// ======================================================
// 5. MAIN COMPONENT: ELEMENTS PANEL
// Manages pages, rows, elements, and drag-and-drop.
// ======================================================

export default function ElementsPanel({
    pages,
    setPages,

    // Shared header and footer settings.
    header,
    footer,

    // Element selection.
    onSelectElement,

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

        if (!over || active.id === over.id) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) return;

        // Row dragging is handled separately.
        if (activeData.type === "row") return;

        const targetRowId = overData.rowId ?? null;
        const targetPageId = overData.pageId;

        if (targetPageId == null) return;

        setPages((previousPages) => {
            let draggedItem = null;

            // First remove the dragged item from its source.
            const updatedPages = previousPages.map((page) => {
                if (page.id !== activeData.pageId) return page;

                // Create copies so the existing state is not mutated.
                const rows = (page.rows || []).map((row) => ({
                    ...row,
                    fields: [...(row.fields || [])],
                    elements: [...(row.elements || [])],
                }));

                // Find and remove the original field.
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

                // Find and remove the created element.
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

                // Find and remove a standalone page element.
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

            // Stop if the dragged item could not be found.
            if (!draggedItem) return previousPages;

            // Then insert the item into its destination.
            return updatedPages.map((page) => {
                if (page.id !== targetPageId) return page;

                // No row means the item belongs directly to the page.
                if (targetRowId == null) {
                    return {
                        ...page,
                        rootElements: [
                            ...(page.rootElements || []),
                            draggedItem,
                        ],
                    };
                }

                // Otherwise insert the item into the selected row.
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
    // 5.2. REORDER PAGES
    // ======================================================

    const handlePageDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        // Get page IDs from the drag data.
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
            const oldIndex = previousPages.findIndex(
                (page) => page.id === activePageId
            );

            const newIndex = previousPages.findIndex(
                (page) => page.id === overPageId
            );

            if (oldIndex === -1 || newIndex === -1) {
                return previousPages;
            }

            // Move the complete page to the new position.
            return arrayMove(previousPages, oldIndex, newIndex);
        });
    };

    // ======================================================
    // 5.3. REORDER ROWS
    // ======================================================

    const handleRowDragEnd = (event, pageId) => {
        const { active, over } = event;

        if (!over) return;

        const activeRowId = active.data.current?.rowId;
        const overRowId = over.data.current?.rowId;

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

                const oldIndex = page.rows.findIndex(
                    (row) => row.id === activeRowId
                );

                const newIndex = page.rows.findIndex(
                    (row) => row.id === overRowId
                );

                if (oldIndex === -1 || newIndex === -1) {
                    return page;
                }

                // Move the complete row.
                return {
                    ...page,
                    rows: arrayMove(page.rows, oldIndex, newIndex),
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
                if (page.id !== pageId) return page;

                return {
                    ...page,
                    rows: (page.rows || []).map((row) => {
                        if (row.id !== rowId) return row;

                        // Get the unique ID for each field.
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

    const handleElementDragEnd = (event, pageId, rowId = null) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setPages((previousPages) =>
            previousPages.map((page) => {
                if (page.id !== pageId) return page;

                // CASE 1: Reorder elements inside a row.
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

                // CASE 2: Reorder standalone page elements.
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
            handleRowDragEnd(event, activeData.pageId);
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
                open: page.id === pageId ? !page.open : false,
            }))
        );
    };

    // ======================================================
    // 6. RENDER ELEMENTS PANEL
    // ======================================================

    return (
        <div className="elements-panel">

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

                    // Restrict page and row dragging to their own containers.
                    collisionDetection={(args) => {
                        const activeType = args.active.data.current?.type;

                        if (activeType === "page") {
                            const pageContainers = args.droppableContainers.filter(
                                (container) =>
                                    container.data.current?.type === "page"
                            );

                            return closestCenter({
                                ...args,
                                droppableContainers: pageContainers,
                            });
                        }

                        if (activeType === "row") {
                            const rowContainers = args.droppableContainers.filter(
                                (container) =>
                                    container.data.current?.type === "row"
                            );

                            return closestCenter({
                                ...args,
                                droppableContainers: rowContainers,
                            });
                        }

                        return closestCenter(args);
                    }}

                    // Store information for the floating drag preview.
                    onDragStart={(event) => {
                        const data = event.active.data.current;

                        setActiveDragItem({
                            label: data?.label || "Element",
                            icon: data?.icon || FileIcon,
                            type: data?.type,
                        });
                    }}

                    // Run the appropriate drag-and-drop handler.
                    onDragEnd={(event) => {
                        handleAllDragEnd(event);
                        setActiveDragItem(null);
                    }}

                    // Clear the floating preview if dragging is cancelled.
                    onDragCancel={() => {
                        setActiveDragItem(null);
                    }}
                >
                    <SortableContext
                        items={pages.map((page) => `page-${page.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        {/* Render all draggable pages. */}

                        {pages.map((page) => (
                            <SortablePage
                                key={page.id}
                                page={page}
                                togglePage={togglePage}

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
    openElementPicker,
}) {
    return (
        <div className="element-tree__section-insert">
            <span className="element-tree__section-insert-line" />

            <button
                type="button"
                className="element-tree__section-insert-button"
                title="Add element here"
                aria-label="Add element here"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();

                    openElementPicker(pageId, rowId ?? null, event, {
                        collection: referenceElementId
                            ? "rootElements"
                            : "rows",
                        placement,
                        referenceElementId: referenceElementId ?? null,
                    });
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

    // Apply drag styling to the page.
    const pageStyle = {
        transform: CSS.Transform.toString(transform),
        transition,

        background: isDragging ? "#FFFFFF" : "transparent",

        boxShadow: isDragging
            ? "0 8px 24px rgba(0, 0, 0, 0.15)"
            : "none",

        border: isDragging
            ? "1px solid #E5E7EB"
            : "1px solid transparent",

        borderRadius: "10px",
        position: "relative",
        zIndex: isDragging ? 10 : "auto",
    };

    // Create insertion buttons above or below root elements.
    const renderRootInsertButton = (element, placement) => (
        <button
            type="button"
            className={`element-tree__item-insert ${
                placement === "before"
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

    return (
        <div
            ref={setNodeRef}
            style={pageStyle}
            className="element-tree__sortable-page"
        >
            {/* PAGE HEADER */}

            <div
                className={`element-tree__page ${
                    page.open ? "element-tree__page--active" : ""
                }`}
                {...attributes}
                {...listeners}
            >
                {/* EXPAND / COLLAPSE BUTTON */}

                <button
                    type="button"
                    className="element-tree__chevron"
                    onClick={() => togglePage(page.id)}
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

                <span className="element-tree__field-icon element-tree__page-icon">
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
                    onClick={() => togglePage(page.id)}
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
                <div className="element-tree__page-content">

                    <SortableContext
                        items={[
                            ...(page.rows || []).map(
                                (row) => `row-${row.id}`
                            ),
                            ...(page.rootElements || []).map(
                                (element) => `element-${element.id}`
                            ),
                        ]}
                        strategy={verticalListSortingStrategy}
                    >
                        {/* INSERT BEFORE THE FIRST ROW */}

                        {(page.rows || []).length > 0 && (
                            <SidebarSectionInsert
                                pageId={page.id}
                                rowId={page.rows[0].id}
                                placement="before"
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
                                            element.insertBeforeRowId === row.id
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

                                    // Row toolbox actions.
                                    onToggleRowVisibility={onToggleRowVisibility}
                                    onDuplicateRow={onDuplicateRow}
                                    onDeleteRow={onDeleteRow}
                                />

                                {/* ROOT ELEMENTS AFTER THIS ROW */}

                                {(page.rootElements || [])
                                    .filter(
                                        (element) =>
                                            element.insertAfterRowId === row.id
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
            className={`element-tree__item-insert ${
                placement === "before"
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
            style={rowStyle}
            className={`element-tree__row ${
                row.visible === false
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

                <span className="element-tree__field-icon element-tree__row-drag-icon">
                    <span className="element-tree__default-icon">
                        <Icon source={FolderIcon} />
                    </span>

                    <span className="element-tree__drag-icon">
                        <Icon source={DragHandleIcon} />
                    </span>
                </span>

                {/* ROW LABEL */}

                <Text as="span" variant="bodySm">
                    Row
                </Text>

                {/* ROW TOOLBOX */}

                {isHovered && (
                    <ElementActions
                        element={row}
                        onToggleElementVisibility={() =>
                            onToggleRowVisibility(pageId, row.id)
                        }
                        onDuplicateElement={() =>
                            onDuplicateRow(pageId, row.id)
                        }
                        onDeleteElement={() =>
                            onDeleteRow(pageId, row.id)
                        }
                    />
                )}
            </div>

            {/* ROW FIELDS AND CREATED ELEMENTS */}

            <div
                ref={setDropRef}
                className={`element-tree__row-fields ${
                    isOver
                        ? "element-tree__row-fields--over"
                        : ""
                }`}
            >
                <SortableContext
                    items={[
                        ...fields.map((field, index) =>
                            getDragItemId(field, index)
                        ),
                        ...elements.map(
                            (element) => `element-${element.id}`
                        ),
                    ]}
                    strategy={verticalListSortingStrategy}
                >
                    {/* ORIGINAL FIELDS */}

                    {fields.map((field, index) => {
                        const fieldId = getDragItemId(field, index);

                        return (
                            <div
                                key={fieldId}
                                className="element-tree__item-wrapper"
                            >
                                {/* ABOVE FIELD */}

                                {renderInsertButton(
                                    "fields",
                                    field.id,
                                    "before"
                                )}

                                <SortableSidebarField
                                    id={fieldId}
                                    field={field}
                                    rowId={row.id}
                                    pageId={pageId}
                                    onSelectElement={onSelectElement}
                                    onToggleElementVisibility={onToggleElementVisibility}
                                    onDuplicateElement={onDuplicateElement}
                                    onDeleteElement={onDeleteElement}
                                />

                                {/* BELOW FIELD */}

                                {renderInsertButton(
                                    "fields",
                                    field.id,
                                    "after"
                                )}
                            </div>
                        );
                    })}

                    {/* CREATED ELEMENTS */}

                    {elements.map((element) => (
                        <div
                            key={element.id}
                            className="element-tree__item-wrapper"
                        >
                            {/* ABOVE ELEMENT */}

                            {renderInsertButton(
                                "elements",
                                element.id,
                                "before"
                            )}

                            <SortableCreatedElement
                                element={element}
                                type="element"
                                rowId={row.id}
                                pageId={pageId}
                                onSelectElement={onSelectElement}
                                onToggleElementVisibility={onToggleElementVisibility}
                                onDuplicateElement={onDuplicateElement}
                                onDeleteElement={onDeleteElement}
                            />

                            {/* BELOW ELEMENT */}

                            {renderInsertButton(
                                "elements",
                                element.id,
                                "after"
                            )}
                        </div>
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
                    : field?.label || field?.type || "Untitled field",

            icon: getElementIcon(
                typeof field === "string" ? field : field?.type
            ),
        },
    });

    // Apply drag styling to the field.
    const style = {
        transform: CSS.Transform.toString(transform),
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
            className={`element-tree__field element-tree__field--draggable ${
                field?.visible === false
                    ? "element-tree__field--hidden"
                    : ""
            }`}
            {...attributes}
            {...listeners}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
                if (typeof field === "object" && field?.id != null) {
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
                                ? field === "First Name" || field === "Last Name"
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
                    : field?.label || field?.type || "Untitled field"}
            </span>

            {/* TOOLBOX: Only fields with IDs support these actions. */}

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
            label: element.label || element.type || "Untitled element",
            icon: getElementIcon(element.type),
        },
    });

    // Apply drag styling to the element.
    const style = {
        transform: CSS.Transform.toString(transform),
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
            className={`element-tree__field element-tree__field--draggable ${
                element.visible === false
                    ? "element-tree__field--hidden"
                    : ""
            }`}
            {...attributes}
            {...listeners}
            onClick={() => onSelectElement?.(element)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ELEMENT ICON AND DRAG HANDLE */}

            <span className="element-tree__field-icon">
                <span className="element-tree__default-icon">
                    <Icon source={getElementIcon(element.type)} />
                </span>

                <span className="element-tree__drag-icon">
                    <Icon source={DragHandleIcon} />
                </span>
            </span>

            {/* ELEMENT LABEL */}

            <span className="element-tree__field-label">
                {element.label || element.type || "Untitled element"}
            </span>

            {/* ELEMENT TOOLBOX */}

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
