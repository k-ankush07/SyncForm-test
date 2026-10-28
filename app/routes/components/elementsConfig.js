
import {
    EmailIcon,
    PersonIcon,
    PhoneIcon,
    LockIcon,
    GlobeIcon,
    CheckboxIcon,
    SelectIcon,
    
    CalendarIcon,
    LinkIcon,
  
    TextBlockIcon,
    TextIcon,
    NoteIcon,
    MinusIcon,
    CheckCircleIcon,
} from "@shopify/polaris-icons";

export const ELEMENT_TYPES = [
    // Contact info
    {
        type: "email",
        label: "Email",
        category: "Contact info",
        icon: EmailIcon,
    },
    {
        type: "name",
        label: "Name",
        category: "Contact info",
        icon: PersonIcon,
    },
    {
        type: "phone",
        label: "Phone",
        category: "Contact info",
        icon: PhoneIcon,
    },
    {
        type: "password",
        label: "Password",
        category: "Contact info",
        icon: LockIcon,
    },
    {
        type: "country",
        label: "Country",
        category: "Contact info",
        icon: GlobeIcon,
    },

    // Selects
    {
        type: "checkboxes",
        label: "Checkboxes",
        category: "Selects",
        icon: CheckboxIcon,
    },
    {
        type: "dropdown",
        label: "Dropdown",
        category: "Selects",
        icon: SelectIcon,
    },
    {
        type: "radio",
        label: "Radio buttons",
        category: "Selects",
        icon:"",
    },
    {
        type: "consent",
        label: "Consent",
        category: "Selects",
        icon: CheckCircleIcon,
    },

    // Input
    {
        type: "url",
        label: "Url",
        category: "Input",
        icon: LinkIcon,
    },
    {
        type: "date",
        label: "Date time",
        category: "Input",
        icon: CalendarIcon,
    },

    // Static text
    {
        type: "heading",
        label: "Heading",
        category: "Static text",
        icon: ""
    },
    {
        type: "paragraph",
        label: "Paragraph",
        category: "Static text",
        icon: TextBlockIcon,
    },
    {
        type: "divider",
        label: "Divider",
        category: "Static text",
        icon: MinusIcon,
    },

    // Text
    {
        type: "text",
        label: "Text",
        category: "Text",
        icon: TextIcon,
    },
    {
        type: "textarea",
        label: "Textarea",
        category: "Text",
        icon: NoteIcon,
    },
];
