
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

const TEXT_TYPES = [
    "text",
    "short_text",
    "textarea",
];

const CHOICE_TYPES = [
    "select",
    "dropdown",
    "radio",
    "radio_group",
    "checkbox",
    "checkbox_group",
    "switch",
    "consent",
];

const NUMBER_TYPES = [
    "number",
    "quantity",
];

const DATE_TYPES = [
    "date",
    "datetime",
    "date_time",
    "datepicker",
    "date_picker",
];

const FILE_TYPES = [
    "file",
    "file_upload",
    "upload",
];

const RATING_TYPES = [
    "rating",
    "ratings",
    "rating_star",
    "rating_level",
];

const CONTENT_TYPES = [
    "heading",
    "paragraph",
    "static_text",
];

const IMAGE_CHOICE_TYPES = [
    "image_options",
    "image_dropdown",
];


// Normalize element types
export function normalizeElementType(type = "") {
    return String(type).toLowerCase().replace(/[\s-]+/g, "_");
}


// Return settings group according to selected element
export function getElementSettingsType(type) {

    const normalizedType = normalizeElementType(type);

    if (CONTACT_TYPES.includes(normalizedType)) return "contact";

    if (TEXT_TYPES.includes(normalizedType)) return "text";

    if (CHOICE_TYPES.includes(normalizedType)) return "choice";

    if (NUMBER_TYPES.includes(normalizedType)) return "number";

    if (DATE_TYPES.includes(normalizedType)) return "date";

    if (FILE_TYPES.includes(normalizedType)) return "file";

    if (RATING_TYPES.includes(normalizedType)) return "rating";

    if (CONTENT_TYPES.includes(normalizedType)) return "content";

    if (IMAGE_CHOICE_TYPES.includes(normalizedType)) return "imageChoice";

    if (normalizedType === "url") return "url";

    if (normalizedType === "range" || normalizedType === "range_slider") {
        return "range";
    }

    return "common";
}
