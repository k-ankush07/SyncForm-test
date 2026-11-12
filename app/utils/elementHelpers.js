
// To normalize newly created field elements into the format we need,
// with unique IDs and default settings.

const DEFAULT_ELEMENT_SETTINGS = {
  placeholder: "",
  description: "",
  defaultValue: "",
  required: false,
  hideLabel: false,
  columnWidth: 100,
  visible: true,
  customClass: "",
};

export function createElementConfig(item) {
  if (!item?.type) {
    throw new Error("Element type is required");
  }

  const type = item.type.toLowerCase().replace(/[\s-]+/g, "_");

  // Element types that need default choice options
  const choiceTypes = [
    "checkboxes",
    "checkbox_group",
    "radio",
    "radio_group",
    "radio_button",
    "dropdown",
    "select",
    "button"
  ];

  // Default options for choice elements
  const defaultOptions = [
    {
      label: "Option 1",
      value: "option1",
    },
    {
      label: "Option 2",
      value: "option2",
    },
  ];

  // Default products for Product element
const defaultProducts = [
  {
    id: crypto.randomUUID(),
    title: "Coffee Mug",
    price: "499",
    image: "",
    description: "",
  },
  {
    id: crypto.randomUUID(),
    title: "Water Bottle",
    price: "799",
    image: "",
    description: "",
  },
  {
    id: crypto.randomUUID(),
    title: "Headphones",
    price: "1499",
    image: "",
    description: "",
  },
];
const products =
  type === "product"
    ? Array.isArray(item.products) && item.products.length > 0
      ? item.products
      : structuredClone(defaultProducts)
    : item.products || [];

  // Use existing options if provided.
  // Otherwise, create two default options for choice elements.
  const sourceOptions =
    Array.isArray(item.options) && item.options.length > 0
      ? item.options
      : choiceTypes.includes(type)
        ? defaultOptions
        : [];

  // Normalize options and give each option a unique ID
  const options = sourceOptions.map((option, index) => {
    if (typeof option === "string") {
      return {
        id: crypto.randomUUID(),
        label: option,
        value: option,
      };
    }

    return {
      id: option.id || crypto.randomUUID(),
      label: option.label || option.value || `Option ${index + 1}`,
      value: option.value || option.label || `option-${index + 1}`,
    };
  });

  return {
    ...DEFAULT_ELEMENT_SETTINGS,
  // Preserve the existing ID or create a new one.
    id: item.id || crypto.randomUUID(),
    type,
    label: item.label || item.type,

    // If content is present, include it
    ...(item.content !== undefined && {
      content: item.content,
    }),

    options,
    products,
    otherOption: false,
    optionsPerLine: 1,

    ...item.settings,
  };
}
