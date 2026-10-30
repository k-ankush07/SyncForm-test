// return the settings accroding to field selected like if email then that settings or checkbox then acc to that
const TEXT_TYPES = [
  "text",
  "short_text",
  "first_name",
  "last_name",
  "name",
  "textarea",
];

const CHOICE_TYPES = [
  "select",
  "dropdown",
  "radio",
  "radio_group",

];
// we need this becuse in taplates we decrible text as name 

export function normalizeElementType(type = "") {
  return type.toLowerCase().replace(/[\s-]+/g, "_");
}

export function getElementSettingsType(type) {
  const normalizedType = normalizeElementType(type);

  if (TEXT_TYPES.includes(normalizedType)) return "text";
  if (["email"].includes(normalizedType)) return "email";
  // Password settings
  if (["password", "confirm_password"].includes(normalizedType)) {
    return "password";
  }
  //country
  if (["country"].includes(normalizedType)) return "country";
  //checkbox
  if (["checkbox", "checkbox_group"].includes(normalizedType)) {
  return "checkbox";
}
  if (["checkbox"].includes(normalizedType)) return "checkbox";
  if (["phone", "tel"].includes(normalizedType)) return "phone";
  if (["date", "datepicker", "date_picker"].includes(normalizedType)) {
    return "date";
  }
  if (["file", "file_upload", "upload"].includes(normalizedType)) {
    return "file";
  }
  if (CHOICE_TYPES.includes(normalizedType)) return "choice";
  if (["number", "quantity", "range"].includes(normalizedType)) {
    return "number";
  }

  return "common";
}
