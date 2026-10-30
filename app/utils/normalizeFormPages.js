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
