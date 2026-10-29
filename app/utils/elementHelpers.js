
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

  const options = (item.options || []).map((option, index) => {
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
    id: crypto.randomUUID(),
    type,
    label: item.label || item.type,
    //if content is presnt then
    ...(item.content !== undefined && {
      content: item.content,
    }),
    options,
    otherOption: false,
    optionsPerLine: 1,
    ...item.settings,
  };
}
