// // return the settings accroding to field selected like if email then that settings or checkbox then acc to that
// // i have creted diffrent settings for each elemnts that are not common the common setting include in common type but unique one for thier
// // specific type that why this copmnte exist
// // when user click on any elemnt type it return the setting type othewise only common
// // in case of button i want to show btn setting then this is used to retur the btnsetting.jsx to elemntsettig page

const CONTACT_TYPES = [
  "email",
  "name",
  "first_name",
  "last_name",
  "phone",
  "tel",
  "password",
  "confirm_password",
  "country",
];

const TEXT_TYPES = ["text", "short_text", "textarea"];

const CHOICE_TYPES = [
  "select",
  "dropdown",
  "radio",
  "radio_group",
  "checkbox",
  "checkboxes",
  "checkbox_group",
];

const NUMBER_TYPES = ["number", "quantity"];

const DATE_TYPES = [
  "date",
  "datetime",
  "date_time",
  "datepicker",
  "date_picker",
];

const FILE_TYPES = ["file", "file_upload", "upload"];

const RATING_TYPES = ["rating", "ratings", "rating_star"];

const IMAGE_CHOICE_TYPES = ["image_options", "image_dropdown"];

const STATIC_TYPES = ["heading", "paragraph", "divider"];

export function normalizeElementType(type = "") {
  return String(type)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function getElementSettingsType(type) {
  const normalizedType = normalizeElementType(type);

  // Special groups must be checked before general groups.
  if (IMAGE_CHOICE_TYPES.includes(normalizedType)) return "imageChoice";
  if (normalizedType === "switch") return "switch";
  if (["color_picker", "color_swatch"].includes(normalizedType)) return "color";
  if (normalizedType === "rating_level") return "ratingLevel";
  if (normalizedType === "range" || normalizedType === "range_slider")
    return "range";
  if (normalizedType === "url") return "url";
  if (normalizedType === "product") return "product";
  if (normalizedType === "matrix") return "matrix";
  if (normalizedType === "feedback") return "feedback";
  if (normalizedType === "hidden") return "hidden";
  if (normalizedType === "repeater") return "repeater";
  if (normalizedType === "signature") return "signature";
  if (normalizedType === "consent") return "consent";
 if (["html", "custom_html"].includes(normalizedType)) return "html";
  if (CONTACT_TYPES.includes(normalizedType)) return "contact";
  if (TEXT_TYPES.includes(normalizedType)) return "text";
  if (CHOICE_TYPES.includes(normalizedType)) return "choice";
  if (NUMBER_TYPES.includes(normalizedType)) return "number";
  if (DATE_TYPES.includes(normalizedType)) return "date";
  if (FILE_TYPES.includes(normalizedType)) return "file";
  if (RATING_TYPES.includes(normalizedType)) return "rating";
  if (normalizedType === "button") return "button";
  if (STATIC_TYPES.includes(normalizedType)) return "static";

  return "common";
}
