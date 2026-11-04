
// To normalize the pre-defined fields and elements
// into the format we need, with unique IDs and default settings.

import { createElementConfig } from "./elementHelpers.js";

function normalizeElement(element) {
  if (typeof element === "string") {
    const type = element.toLowerCase().replace(/[\s-]+/g, "_");

    return createElementConfig({
      type,
      label: element,
    });
  }

  if (!element || typeof element !== "object") {
    return null;
  }

  // Normalize existing elements and preserve their properties.
  const normalized = createElementConfig({
    ...element,
    settings: {
      ...element,
    },
  });

  return normalized;
}

// Get default options based on element type
// function getDefaultOptions(type) {
//   switch (type) {
//     case "checkboxes":
//     case "checkbox_group":
//     case "radio":
//     case "radio_button":
//     case "dropdown":
//     case "select":
//       return [
//         {
//           id: crypto.randomUUID(),
//           label: "Option 1",
//           value: "option1",
//         },
//         {
//           id: crypto.randomUUID(),
//           label: "Option 2",
//           value: "option2",
//         },
//       ];

//     default:
//       return [];
//   }
// }

export function normalizeFormPages(pages) {
  return (pages || []).map((page) => ({
    ...page,

    visible: page.visible ?? true,

    // Normalize the predefined header
    header: page.header
      ? normalizeElement(page.header)
      : page.header,

    // Normalize rows and their fields/elements
    rows: (page.rows || []).map((row) => ({
      ...row,

      fields: (row.fields || [])
        .map(normalizeElement)
        .filter(Boolean),

      elements: (row.elements || [])
        .map(normalizeElement)
        .filter(Boolean),
    })),

    // Normalize standalone/root elements
    rootElements: (page.rootElements || [])
      .map(normalizeElement)
      .filter(Boolean),

    // Normalize the predefined footer
    footer: page.footer
      ? normalizeElement(page.footer)
      : page.footer,
  }));
}
