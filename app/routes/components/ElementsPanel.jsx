
import React, { useState } from "react";
import { Box, Divider, Text, Icon } from "@shopify/polaris";
import {
  PlusCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  TextIcon,
  EmailIcon,
  PhoneIcon,
  NoteIcon,
} from "@shopify/polaris-icons";

export default function ElementsPanel() {
  const [pageOpen, setPageOpen] = useState(true);
  const [rowsOpen, setRowsOpen] = useState([true, true]);

  const [rows, setRows] = useState([
    [
      { id: 1, label: "First Name", type: "text" },
      { id: 2, label: "Last Name", type: "text" },
    ],
    [
      { id: 3, label: "Email", type: "email" },
      { id: 4, label: "Phone", type: "phone" },
    ],
  ]);

  const [message, setMessage] = useState({
    id: 5,
    label: "Message",
    type: "message",
  });

  const fieldIcons = {
    text: TextIcon,
    email: EmailIcon,
    phone: PhoneIcon,
    message: NoteIcon,
  };

  const addElement = (rowIndex) => {
    const newField = {
      id: Date.now(),
      label: "New field",
      type: "text",
    };

    if (rowIndex === -1) {
      setMessage(newField);
      return;
    }

    setRows((previous) =>
      previous.map((row, index) =>
        index === rowIndex ? [...row, newField] : row
      )
    );
  };

  const addRow = () => {
    setRows((previous) => [...previous, []]);
    setRowsOpen((previous) => [...previous, true]);
  };

  const addPage = () => {
    alert("Add page functionality will be added next.");
  };

  const renderField = (field) => {
    const FieldIcon = fieldIcons[field.type] || TextIcon;

    return (
      <div className="element-tree__field" key={field.id}>
        <Icon source={FieldIcon} />
        <Text as="span" variant="bodySm">
          {field.label}
        </Text>
      </div>
    );
  };

  return (
    <div className="elements-panel">
      {/* Header */}
      <div className="elements-panel__header">
        <Text as="span">▧</Text>
        <Text as="span" fontWeight="semibold">
          Header
        </Text>
      </div>

      <Divider />

      {/* Elements title */}
      <Box paddingBlock="300" paddingInline="400">
        <Text as="p" variant="bodySm" tone="subdued">
          Elements
        </Text>
      </Box>

      {/* Page and fields */}
      <div className="element-tree">
        <button
          type="button"
          className="element-tree__page"
          onClick={() => setPageOpen((previous) => !previous)}
        >
          <Icon source={pageOpen ? ChevronDownIcon : ChevronRightIcon} />
          <Icon source={FileIcon} />
          <span>Page 1</span>
        </button>

        {pageOpen && (
          <div className="element-tree__page-content">
            {rows.map((row, rowIndex) => (
              <div className="element-tree__row" key={rowIndex}>
                <button
                  type="button"
                  className="element-tree__row-heading"
                  onClick={() =>
                    setRowsOpen((previous) =>
                      previous.map((open, index) =>
                        index === rowIndex ? !open : open
                      )
                    )
                  }
                >
                  <Icon
                    source={
                      rowsOpen[rowIndex]
                        ? ChevronDownIcon
                        : ChevronRightIcon
                    }
                  />
                  <span>▱</span>
                  <span>Row</span>
                </button>

                {rowsOpen[rowIndex] && (
                  <div className="element-tree__row-fields">
                    {row.map(renderField)}

                    <button
                      type="button"
                      className="element-tree__add"
                      onClick={() => addElement(rowIndex)}
                    >
                      <Icon source={PlusCircleIcon} />
                      Add element
                    </button>
                  </div>
                )}
              </div>
            ))}

            {renderField(message)}

            <button
              type="button"
              className="element-tree__add"
              onClick={() => addElement(-1)}
            >
              <Icon source={PlusCircleIcon} />
              Add element
            </button>

            <button
              type="button"
              className="element-tree__add element-tree__add--page"
              onClick={addPage}
            >
              <Icon source={PlusCircleIcon} />
              Add page
            </button>

            <button
              type="button"
              className="element-tree__add"
              onClick={addRow}
            >
              <Icon source={PlusCircleIcon} />
              Add row
            </button>
          </div>
        )}
      </div>

      {/* Footer at the bottom */}
      <div className="elements-panel__footer">
        <Divider />
        <div className="elements-panel__header">
          <Text as="span">▧</Text>
          <Text as="span" fontWeight="semibold">
            Footer
          </Text>
        </div>
      </div>
    </div>
  );
}
