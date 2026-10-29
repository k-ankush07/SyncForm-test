import {
    EmailIcon,
    PersonIcon,
    PhoneIcon,
    LockIcon,
    GlobeIcon,
    ImageIcon,
    CheckboxIcon,
    SelectIcon,
    CheckCircleIcon,
    ToggleOnIcon,
   // SliderIcon,
    ButtonIcon,
    ProductIcon,
    LinkIcon,
    CalendarTimeIcon,
    HideIcon,
    DuplicateIcon,
    EditIcon,
    TextTitleIcon,
    TextBlockIcon,
    CodeIcon,
    MinusIcon,
    TextIcon,
    NoteIcon,
    HashtagDecimalIcon,
    //OrderedListIcon,
   // EmojiHappyIcon,
    //GridIcon,
    ChartVerticalIcon,
    StarIcon,
    AttachmentIcon,
    ColorIcon,
    EyeDropperIcon,
} from "@shopify/polaris-icons";

// disabled: true  => greyed out / upgrade-locked in the modal
// badge: "Hot" | "New" => badge shown next to the label
export const ELEMENT_TYPES = [
    // Contact info
    { type: "email", label: "Email", category: "Contact info", icon: EmailIcon },
    { type: "name", label: "Name", category: "Contact info", icon: PersonIcon },
    { type: "phone", label: "Phone", category: "Contact info", icon: PhoneIcon },
    { type: "password", label: "Password", category: "Contact info", icon: LockIcon },
    { type: "country", label: "Country", category: "Contact info", icon: GlobeIcon },

    // Selects
    { type: "image_options", label: "Image Options", category: "Selects", icon: ImageIcon, disabled: true, badge: "Hot" },
    { type: "checkboxes", label: "Checkboxes", category: "Selects", icon: CheckboxIcon },
    { type: "dropdown", label: "Dropdown", category: "Selects", icon: SelectIcon },
    { type: "radio", label: "Radio buttons", category: "Selects", icon: CheckCircleIcon },
    { type: "consent", label: "Consent", category: "Selects", icon: CheckboxIcon },
    { type: "switch", label: "Switch", category: "Selects", icon: ToggleOnIcon, disabled: true, badge: "New" },
    
    // { type: "range_slider", label: "Range slider", category: "Selects", icon: SliderIcon, disabled: true, badge: "New" },
    { type: "image_dropdown", label: "Image Dropdown", category: "Selects", icon: SelectIcon, disabled: true, badge: "New" },
    { type: "button", label: "Button", category: "Selects", icon: ButtonIcon },
    { type: "product", label: "Product", category: "Selects", icon: ProductIcon, disabled: true, badge: "Hot" },

    // Input
    { type: "url", label: "Url", category: "Input", icon: LinkIcon },
    { type: "date", label: "Date time", category: "Input", icon: CalendarTimeIcon, badge: "Hot" },
    { type: "hidden", label: "Hidden", category: "Input", icon: HideIcon, disabled: true },
    { type: "repeater", label: "Repeater", category: "Input", icon: DuplicateIcon, disabled: true, badge: "New" },
    { type: "signature", label: "Signature", category: "Input", icon: EditIcon, disabled: true, badge: "New" },

    // Static text
    { type: "heading", label: "Heading", category: "Static text", icon: TextTitleIcon },
    { type: "paragraph", label: "Paragraph", category: "Static text", icon: TextBlockIcon },
    { type: "html", label: "HTML", category: "Static text", icon: CodeIcon, disabled: true },
    { type: "divider", label: "Divider", category: "Static text", icon: MinusIcon },

    // Text
    { type: "text", label: "Text", category: "Text", icon: TextIcon },
    { type: "textarea", label: "Textarea", category: "Text", icon: NoteIcon },

    // Number
    { type: "number", label: "Number", category: "Number", icon: HashtagDecimalIcon },
    // { type: "quantity", label: "Quantity", category: "Number", icon: OrderedListIcon, badge: "Hot" },

    // Ratings
    // { type: "feedback", label: "Feedback", category: "Ratings", icon: EmojiHappyIcon, disabled: true, badge: "Hot" },
    // { type: "matrix", label: "Matrix", category: "Ratings", icon: TableIcon, disabled: true },
    { type: "rating_level", label: "Rating level", category: "Ratings", icon: ChartVerticalIcon, disabled: true, badge: "New" },
    { type: "rating_star", label: "Rating star", category: "Ratings", icon: StarIcon },

    // File upload
    { type: "file_upload", label: "File Upload", category: "File upload", icon: AttachmentIcon, badge: "Hot" },

    // Color
    { type: "color_swatch", label: "Color Swatch", category: "Color", icon: ColorIcon, disabled: true, badge: "New" },
    { type: "color_picker", label: "Color Picker", category: "Color", icon: EyeDropperIcon, disabled: true, badge: "New" },
];