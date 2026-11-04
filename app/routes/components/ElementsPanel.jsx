
import React, { useState } from "react";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
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
} from "@shopify/polaris";

import { ELEMENT_TYPES } from "../../utils/elementsConfig.js";
// import the create element config 
import "../../ElementsPanel.css";
// import { createElementConfig } from "../../utils/elementHelpers.js"
// import ElementPickerPopover from "./ElementPickerPopover.jsx";

import {
    PlusCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    FileIcon,
    FolderIcon,
    LayoutSectionIcon,
} from "@shopify/polaris-icons";

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
    openElementPicker, }) {


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

    const handlePageDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

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
    };

    // ======================================================
    // FUNCTION: REORDER ROWS
    // Moves a row within its own page.
    // ======================================================

    const handleRowDragEnd = (event, pageId) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setPages((previousPages) =>
            previousPages.map((page) => {
                // Only update the page containing the dragged row.
                if (page.id !== pageId) return page;

                const oldIndex = page.rows.findIndex(
                    (row) => `row-${row.id}` === active.id
                );

                const newIndex = page.rows.findIndex(
                    (row) => `row-${row.id}` === over.id
                );

                if (oldIndex === -1 || newIndex === -1) {
                    return page;
                }

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
    // FUNCTION: OPEN ELEMENT PICKER
    // Opens the modal and remembers where to add the element.
    // ======================================================

    // const openElementPicker = (pageId, rowId = null, event) => {
    //     if (!event?.currentTarget) return;

    //     const buttonRect = event.currentTarget.getBoundingClientRect();

    //     const modalWidth = Math.min(680, window.innerWidth - 24);
    //     const modalHeight = Math.min(430, window.innerHeight - 24);

    //     // Position the picker to the right of the clicked button.
    //     let left =
    //         rowId !== null
    //             ? buttonRect.left + 200
    //             : buttonRect.right + 8;

    //     // If there is not enough room on the right,
    //     // move it to the left of the button.
    //     if (left + modalWidth > window.innerWidth - 12) {
    //         left = buttonRect.left - modalWidth - 8;
    //     }

    //     // Keep the picker inside the screen horizontally.
    //     left = Math.max(
    //         12,
    //         Math.min(left, window.innerWidth - modalWidth - 12)
    //     );

    //     // Align it with the clicked button when possible.
    //     // Move it upward if it would extend beyond the screen.
    //     const top = Math.max(
    //         12,
    //         Math.min(
    //             buttonRect.top - 20,
    //             window.innerHeight - modalHeight - 12
    //         )
    //     );

    //     setElementPickerPosition({ top, left });
    //     setElementTarget({ pageId, rowId });
    //     setElementPickerOpen(true);
    // };

    // ======================================================
    // FUNCTION: SELECT AN ELEMENT
    // Adds the selected element to the correct page or row. pick from popover modal
    // ======================================================

    // const handleSelectElement = (item) => {
    //     if (!elementTarget || !item?.type) return;

    //     const newElement = createElementConfig(item);

    //     setPages((previousPages) =>
    //         previousPages.map((page) => {
    //             if (page.id !== elementTarget.pageId) return page;

    //             if (elementTarget.rowId != null) {
    //                 return {
    //                     ...page,
    //                     rows: (page.rows || []).map((row) =>
    //                         row.id !== elementTarget.rowId
    //                             ? row
    //                             : {
    //                                 ...row,
    //                                 elements: [
    //                                     ...(row.elements || []),
    //                                     newElement,
    //                                 ],
    //                             }
    //                     ),
    //                 };
    //             }

    //             return {
    //                 ...page,
    //                 rootElements: [
    //                     ...(page.rootElements || []),
    //                     newElement,
    //                 ],
    //             };
    //         })
    //     );

    //     setElementPickerOpen(false);
    //     setElementTarget(null);
    // };


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

            {/* ==================================================
              PAGES LIST
              This context allows the pages to be reordered.
             ================================================== */}

            <div className="element-tree">

                {/* SHARED DRAG AND DROP CONTEXT */}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleAllDragEnd}
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
                            />
                        ))}
                    </SortableContext>
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
    openElementPicker,
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
        },
    });

    // Apply the drag position and visual feedback.
    const pageStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
    };

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
                    {...attributes}
                    {...listeners}
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
            </div>

            {/* PAGE CONTENT
              Rows and root elements are shown only when open. */}

            {page.open && (
                <div className="element-tree__page-content">

                    {/* ==============================================
                      ROWS LIST and ROOT ELEMENT LIST BOTH 
                      This context allows rows  AND root elements to be reordered
                      within the current page.
                     ============================================== */}

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
}) {
    // use soratable for the row itself => Allows you to drag and reorder the row
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
        },
    });
    // USE DROPABLE => Allows you to drop elements inside the row
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
        opacity: isDragging ? 0.55 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={rowStyle}
            className="element-tree__row"
        >
            {/* ROW HEADING AND DRAG HANDLE */}

            <div className="element-tree__row-heading">
                {/* Folder icon changes to drag icon on hover */}

                <span
                    className="element-tree__field-icon element-tree__row-drag-icon"
                    {...attributes}
                    {...listeners}
                >
                    <span className="element-tree__default-icon">
                        <Icon source={FolderIcon} />
                    </span>

                    <span className="element-tree__drag-icon">⠿</span>
                </span>

                {/* Row label */}

                <Text as="span" variant="bodySm">
                    Row
                </Text>
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

function SortableSidebarField({ id, field, rowId, pageId }) {
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
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="element-tree__field element-tree__field--draggable"
            {...attributes}
            {...listeners}
        >
            <span className="element-tree__field-icon">
                <span className="element-tree__default-icon">
                    <Icon source={FileIcon} />
                </span>

                <span className="element-tree__drag-icon">⠿</span>
            </span>

            <span className="element-tree__field-label">
                {typeof field === "string"
                    ? field
                    : field?.label || field?.type || "Untitled field"}
            </span>
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
}) {
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
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="element-tree__field element-tree__field--draggable"
            {...attributes}
            {...listeners}
        >
            <span className="element-tree__field-icon">
                <span className="element-tree__default-icon">
                    <Icon source={FileIcon} />
                </span>

                <span className="element-tree__drag-icon">⠿</span>
            </span>

            <span className="element-tree__field-label">
                {element.label}
            </span>
        </div>
    );
}
