// return the settings accroding to field selected like if email then that settings or checkbox then acc to that
// i have creted diffrent settings for each elemnts that are not common the common setting include in common type but unique one for thier 
// specific type that why this copmnte exist 
// when user click on any elemnt type it return the setting type othewise only common
// in case of button i want to show btn setting then this is used to retur the btnsetting.jsx to elemntsettig page 
const TEXT_TYPES = [
  "text",
  "short_text",
  "first_name",
  "last_name",
  "name",
  "textarea",
  "country"
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
