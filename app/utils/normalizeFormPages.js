// to normalize the pre defined fields elemnts in the format we need like with unique id and more fields
import { createElementConfig } from "./elementHelpers.js";

function normalizeElement(element) {
  if (typeof element === "string") {
    const type = element.toLowerCase().replace(/[\s-]+/g, "_");

    return createElementConfig({
      type,
      label: element,
    });
  }

  // Get default options based on element type
function getDefaultOptions(type) {
    switch (type) {
        case "checkboxes":
        case "checkbox_group":
            return [
                {
                    id: crypto.randomUUID(),
                    label: "Option 1",
                    value: "option1",
                },
                {
                    id: crypto.randomUUID(),
                    label: "Option 2",
                    value: "option2",
                },
            ];

        case "radio":
        case "radio_button":
        case "dropdown":
        case "select":
            return [
                {
                    id: crypto.randomUUID(),
                    label: "Option 1",
                    value: "option1",
                },
                {
                    id: crypto.randomUUID(),
                    label: "Option 2",
                    value: "option2",
                },
            ];

        default:
            return [];
    }
}

  if (!element || typeof element !== "object") {
    return null;
  }

  const normalized = createElementConfig({
    ...element,
    settings: {
      ...element,
    },
  });

  return normalized;
}

export function normalizeFormPages(pages) {
  return (pages || []).map((page) => ({
    ...page,
    visible: page.visible ?? true,

    rows: (page.rows || []).map((row) => ({
      ...row,

      fields: (row.fields || [])
        .map(normalizeElement)
        .filter(Boolean),

      elements: (row.elements || [])
        .map(normalizeElement)
        .filter(Boolean),
    })),

    rootElements: (page.rootElements || [])
      .map(normalizeElement)
      .filter(Boolean),
  }));
}
