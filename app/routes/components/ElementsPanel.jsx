
import React, { useState } from "react";

import { Divider, Text, Icon } from "@shopify/polaris";

import "../../ElementsPanel.css"
import {
    PlusCircleIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    FileIcon,
    FolderIcon,
    LayoutSectionIcon,
} from "@shopify/polaris-icons";

export default function ElementsPanel({ pages, setPages }) {

    // ==================================================
    // STEP 1: CREATE STATE FOR PAGES
    // ==================================================
    // this logic is in parent page 
    

    // ==================================================
    // STEP 2: ADD A NEW PAGE
    // ==================================================
    //
    // This function runs when the user clicks "Add page".
    //
    // setPages updates the pages state.
    //
    // previousPages contains all existing pages.
    //
    // ...previousPages copies the existing pages.
    //
    // The new page is added at the end of the array.
    //
    // New pages start with empty rows and empty elements.
    // Only Page 1 has the two initial rows.

    
const addPage = () => {
  setPages((previousPages) => [
    ...previousPages.map((page) => ({
      ...page,
      open: false,
    })),
    {
      id: Date.now(),
      // new page name will be pre page + 1
      label: `Page ${previousPages.length + 1}`,
      // new crete will be open 
      open: true,
      // initally row is empty
      rows: [],
      rootElements: [],
    },
  ]);
};


    // ==================================================
    // STEP 3: OPEN OR CLOSE A PAGE
    // ==================================================
    //
    // pageId tells us which page was clicked.
    //
    // map() checks every page.
    //
    // If the page ID matches, we create a copy of that
    // page and reverse its "open" value:
    //
    // true  becomes false (close the page)
    // false becomes true  (open the page)
    //
    // Other pages remain unchanged.

    const togglePage = (pageId) => {
  setPages((previousPages) =>
    previousPages.map((page) => ({
      ...page,
      open: page.id === pageId ? !page.open : false,
    }))
  );
};

    // ==================================================
    // STEP 4: ADD AN ELEMENT INSIDE A ROW
    // ==================================================
    //
    // This function is called by the Add elements button
    // belonging to a particular row.
    //
    // It receives TWO IDs:
    //
    // pageId = which page contains the row?
    // rowId  = which row should receive the element?
    //
    // First, map() finds the correct page.
    //
    // Inside that page, another map() finds the correct row.
    //
    // Only the selected row's "elements" array changes.
    // The other row and the other pages stay unchanged.
    //
    // For now, the new element is a placeholder called
    // "New element". Later, we can open the element picker.

    const addRowElement = (pageId, rowId) => {
        setPages((previousPages) =>
            previousPages.map((page) => {

                // If this is not the selected page,
                // return it without changing anything.
                if (page.id !== pageId) {
                    return page;
                }

                // This is the selected page.
                return {
                    ...page,

                    // Check each row on this page.
                    rows: page.rows.map((row) => {

                        // If this is not the selected row,
                        // leave it unchanged.
                        if (row.id !== rowId) {
                            return row;
                        }

                        // This is the selected row.
                        // Copy its existing elements and append
                        // one new element to the end.
                        return {
                            ...row,

                            elements: [
                                ...row.elements,

                                {
                                    id: Date.now(),
                                    label: "New element",
                                },
                            ],
                        };
                    }),
                };
            })
        );
    };

    // ==================================================
    // STEP 5: ADD AN ELEMENT OUTSIDE THE ROWS
    // ==================================================
    //
    // This function belongs to the full-width Add elements
    // button below the two rows.
    //
    // Unlike addRowElement(), this function does not
    // search for a row.
    //
    // It updates the selected page's rootElements array.
    //
    // Therefore, the new element appears OUTSIDE the rows.

    const addRootElement = (pageId) => {
        setPages((previousPages) =>
            previousPages.map((page) => {

                // Leave other pages unchanged.
                if (page.id !== pageId) {
                    return page;
                }

                // Update the selected page.
                return {
                    ...page,

                    // Copy existing outside elements and append
                    // the newly created element.
                    rootElements: [
                        ...page.rootElements,

                        {
                            id: Date.now(),
                            label: "New element",
                        },
                    ],
                };
            })
        );
    };

    // ==================================================
    // STEP 6: DISPLAY THE COMPONENT
    // ==================================================

    return (
        <div className="elements-panel">

            {/* ----------------------------------------------
          HEADER SECTION
          ----------------------------------------------
          Displays the Header heading at the top.
      */}

            <div className="elements-panel__header">

                <span className="elements-panel__section-icon">
                    <Icon source={LayoutSectionIcon} />
                </span>

                <Text as="span" fontWeight="semibold">
                    Header
                </Text>

            </div>

            {/* Horizontal divider below Header */}
            <Divider />


            {/* ----------------------------------------------
          ELEMENTS HEADING
          ----------------------------------------------
          Displays the heading above the page list.
      */}

            <div className="elements-panel__section-title">
                <Text as="span" variant="bodySm" tone="subdued">
                    Elements
                </Text>
            </div>


            {/* ----------------------------------------------
          PAGES CONTAINER
          ----------------------------------------------
          pages.map() creates the UI for every page
          stored in our pages state.
      */}

            <div className="element-tree">

                {pages.map((page) => (

                    // React needs a unique key for each page.
                    <div key={page.id}>

                        {/* ----------------------------------------
                PAGE HEADING
                ----------------------------------------
                Clicking this button opens or closes
                this specific page.
            */}

                        <button
                            type="button"
                            className="element-tree__page"
                            onClick={() => togglePage(page.id)}
                        >

                            {/* Show a down arrow when open.
                  Show a right arrow when closed. */}

                            <span className="element-tree__chevron">
                                <Icon
                                    source={
                                        page.open
                                            ? ChevronDownIcon
                                            : ChevronRightIcon
                                    }
                                />
                            </span>

                            {/* Page icon */}
                            <span className="element-tree__node-icon">
                                <Icon source={FileIcon} />
                            </span>

                            {/* Page name comes from state */}
                            <span className="element-tree__node-label">
                                {page.label}
                            </span>

                        </button>


                        {/* ----------------------------------------
                PAGE CONTENT
                ----------------------------------------
                Render this section only when the page
                is open.
            */}

                        {page.open && (

                            <div className="element-tree__page-content">


                                {/* ====================================
                    STEP 7: DISPLAY THE EXISTING ROWS
                    ====================================
                    page.rows contains the rows belonging
                    to this page.

                    We display them with map().

                    There is NO Add Row button.
                */}

                                {page.rows.map((row, index) => (

                                    <div
                                        key={row.id}
                                        className="element-tree__row"
                                    >

                                        {/* Show the row number */}
                                        <div className="element-tree__row-heading">
                                            <span className="element-tree__row-icon">
                                                <Icon source={FolderIcon} />
                                            </span>

                                            <Text as="span" variant="bodySm">
                                                Row
                                            </Text>
                                        </div>


                                        {/* --------------------------------
                        DISPLAY FIELDS AND NEW ELEMENTS
                        --------------------------------
                        row.fields contains the original
                        field names.

                        row.elements contains the extra
                        elements added by the user.
                    */}

                                        <div className="element-tree__row-fields">

                                            {/* Display the original fields */}
                                            {row.fields.map((field) => (

                                                <div
                                                    key={`${row.id}-${field}`}
                                                    className="element-tree__field"
                                                >

                                                    <span className="element-tree__field-icon">
                                                        <Icon source={FileIcon} />
                                                    </span>

                                                    <span className="element-tree__field-label">
                                                        {field}
                                                    </span>

                                                </div>

                                            ))}


                                            {/* Display elements added to this row */}
                                            {row.elements.map((element) => (

                                                <div
                                                    key={element.id}
                                                    className="element-tree__field"
                                                >

                                                    <span className="element-tree__field-icon">
                                                        <Icon source={FileIcon} />
                                                    </span>

                                                    <span className="element-tree__field-label">
                                                        {element.label}
                                                    </span>

                                                </div>

                                            ))}

                                        </div>


                                        {/* --------------------------------
                        ADD ELEMENTS BUTTON FOR THIS ROW
                        --------------------------------
                        row.id tells the function which
                        row needs the new element.

                        page.id tells it which page
                        contains that row.
                    */}

                                        <button
                                            type="button"
                                            className="element-tree__add"
                                            onClick={() =>
                                                addRowElement(page.id, row.id)
                                            }
                                        >

                                            <Icon source={PlusCircleIcon} />

                                            <span>Add elements</span>

                                        </button>

                                    </div>

                                ))}


                                {/* ====================================
                    STEP 8: DISPLAY OUTSIDE ELEMENTS
                    ====================================
                    rootElements belongs to the page,
                    not to any row.

                    These elements appear after the rows.
                */}

                                {page.rootElements.map((element) => (

                                    <div
                                        key={element.id}
                                        className="element-tree__field"
                                    >

                                        <span className="element-tree__field-icon">
                                            <Icon source={FileIcon} />
                                        </span>

                                        <span className="element-tree__field-label">
                                            {element.label}
                                        </span>

                                    </div>

                                ))}


                                {/* ------------------------------------
                    FULL-WIDTH ADD ELEMENTS BUTTON
                    ------------------------------------
                    This button calls addRootElement().

                    Notice that we pass only page.id.
                    We do NOT pass row.id because this
                    element belongs outside the rows.
                */}

                                <button
                                    type="button"
                                    className="element-tree__add element-tree__add--root"
                                    onClick={() => addRootElement(page.id)}
                                >

                                    <Icon source={PlusCircleIcon} />

                                    <span>Add elements</span>

                                </button>

                            </div>

                        )}

                    </div>

                ))}


                {/* --------------------------------------------
            ADD PAGE BUTTON
            --------------------------------------------
            This button is outside the page content,
            so it remains visible when pages are closed.
        */}

                <button
                    type="button"
                    className="element-tree__add element-tree__add--page"
                    onClick={addPage}
                >

                    <Icon source={PlusCircleIcon} />

                    <span>Add page</span>

                </button>

            </div>


            {/* ----------------------------------------------
          FOOTER SECTION
          ----------------------------------------------
          Displays the Footer heading at the bottom.
      */}

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

        </div>
    );
}
