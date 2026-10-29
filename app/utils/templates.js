export  const templates = [
  // 1. Contact Form
  {
    id: 1,
    title: "Contact form",
    description: "Basic contact form",
    category: "contact",
    image: "/images/contact.fc71ad9f717b4b182c75.png",
    theme: "classic",
    layout: "stacked",
    type: "contact",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [
          {
            id: 101,
            fields: ["First Name", "Last Name"],
            elements: [],
          },
          {
            id: 102,
            fields: ["Email", "Phone"],
            elements: [],
          },
        ],
        rootElements: [
          {
            id: 103,
            label: "Message",
            type: "textarea",
            elements: [],
          },
        ],
        submitButton: {
          label: "Send message",
          enabled: true,
        },
      },
    ],
  },

  // 2. Registration Form
  {
    id: 2,
    title: "Create an account",
    description: "Complete the form below to create your account.",
    category: "register",
    theme: "modern",
    layout: "stacked",
    type: "registration2",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [
          {
            id: 201,
            fields: ["First Name", "Last Name"],
            elements: [],
          },
          {
            id: 202,
            fields: ["Email", "Phone"],
            elements: [],
          },
          {
            id: 203,
            fields: ["Password", "Confirm Password"],
            elements: [],
          },
        ],
        rootElements: [],
        submitButton: {
          label: "Create account",
          enabled: true,
        },
      },
    ],
  },

  // 3. Customer Feedback Form (no rows)
  {
    id: 3,
    title: "Customer feedback",
    description: "Tell us about your experience with our store.",
    category: "feedback",
    theme: "classic",
    layout: "stacked",
    type: "feedback",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [],
        rootElements: [
          {
            id: 301,
            label: "Full Name",
            type: "text",
            elements: [],
          },
          {
            id: 302,
            label: "Email Address",
            type: "email",
            elements: [],
          },
          {
            id: 303,
            label: "How would you rate your experience?",
            type: "rating",
            elements: [],
          },
          {
            id: 304,
            label: "What did you like?",
            type: "textarea",
            elements: [],
          },
          {
            id: 305,
            label: "What could we improve?",
            type: "textarea",
            elements: [],
          },
        ],
        submitButton: {
          label: "Submit feedback",
          enabled: true,
        },
      },
    ],
  },

  // 4. Newsletter Signup (no rows)
  {
    id: 4,
    title: "Newsletter signup",
    description: "Subscribe to receive news, offers, and updates.",
    category: "newsletter",
    theme: "modern",
    layout: "stacked",
    type: "newsletter",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [],
        rootElements: [
          {
            id: 401,
            label: "First Name",
            type: "text",
            elements: [],
          },
          {
            id: 402,
            label: "Email Address",
            type: "email",
            elements: [],
          },
          {
            id: 403,
            label: "What are you interested in?",
            type: "select",
            options: ["New Arrivals", "Discounts", "Product Updates"],
            elements: [],
          },
          {
            id: 404,
            label: "I agree to receive email updates",
            type: "checkbox",
            elements: [],
          },
        ],
        submitButton: {
          label: "Subscribe",
          enabled: true,
        },
      },
    ],
  },

  // 5. Product Enquiry Form (no rows)
  {
    id: 5,
    title: "Product enquiry",
    description: "Have a question about a product? Send us a message.",
    category: "product",
    theme: "classic",
    layout: "stacked",
    type: "product-enquiry",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [],
        rootElements: [
          {
            id: 501,
            label: "Your Name",
            type: "text",
            elements: [],
          },
          {
            id: 502,
            label: "Email Address",
            type: "email",
            elements: [],
          },
          {
            id: 503,
            label: "Product Name",
            type: "text",
            elements: [],
          },
          {
            id: 504,
            label: "Order Number (optional)",
            type: "text",
            elements: [],
          },
          {
            id: 505,
            label: "Your Question",
            type: "textarea",
            elements: [],
          },
        ],
        submitButton: {
          label: "Send enquiry",
          enabled: true,
        },
      },
    ],
  },

  // 6. Job Application Form
  {
    id: 6,
    title: "Job application",
    description: "Apply to join our team.",
    category: "application",
    theme: "modern",
    layout: "stacked",
    type: "job-application",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [
          {
            id: 601,
            fields: ["First Name", "Last Name"],
            elements: [],
          },
          {
            id: 602,
            fields: ["Email", "Phone"],
            elements: [],
          },
        ],
        rootElements: [
          {
            id: 603,
            label: "Position Applying For",
            type: "select",
            options: ["Developer", "Designer", "Marketing", "Customer Support"],
            elements: [],
          },
          {
            id: 604,
            label: "Relevant Experience",
            type: "select",
            options: ["No experience", "1-2 years", "3-5 years", "5+ years"],
            elements: [],
          },
          {
            id: 605,
            label: "Tell us about yourself",
            type: "textarea",
            elements: [],
          },
        ],
        submitButton: {
          label: "Submit application",
          enabled: true,
        },
      },
    ],
  },

  // 7. Event Registration (no rows)
  {
    id: 7,
    title: "Event registration",
    description: "Register your details to reserve your place.",
    category: "event",
    theme: "classic",
    layout: "stacked",
    type: "event-registration",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [],
        rootElements: [
          {
            id: 701,
            label: "Full Name",
            type: "text",
            elements: [],
          },
          {
            id: 702,
            label: "Email Address",
            type: "email",
            elements: [],
          },
          {
            id: 703,
            label: "Number of Attendees",
            type: "number",
            elements: [],
          },
          {
            id: 704,
            label: "Preferred Session",
            type: "radio",
            options: ["Morning", "Afternoon", "Evening"],
            elements: [],
          },
          {
            id: 705,
            label: "Special Requirements",
            type: "textarea",
            elements: [],
          },
        ],
        submitButton: {
          label: "Register now",
          enabled: true,
        },
      },
    ],
  },

  // 8. Order Support Form (no rows)
  {
    id: 8,
    title: "Order support",
    description: "Let us help you with your order.",
    category: "support",
    theme: "modern",
    layout: "stacked",
    type: "order-support",
    pages: [
      {
        id: 1,
        label: "Page 1",
        open: true,
        rows: [],
        rootElements: [
          {
            id: 801,
            label: "Full Name",
            type: "text",
            elements: [],
          },
          {
            id: 802,
            label: "Email Address",
            type: "email",
            elements: [],
          },
          {
            id: 803,
            label: "Order Number",
            type: "text",
            elements: [],
          },
          {
            id: 804,
            label: "What do you need help with?",
            type: "select",
            options: [
              "Track my order",
              "Return or exchange",
              "Damaged item",
              "Refund",
              "Other",
            ],
            elements: [],
          },
          {
            id: 805,
            label: "Describe your issue",
            type: "textarea",
            elements: [],
          },
        ],
        submitButton: {
          label: "Contact support",
          enabled: true,
        },
      },
    ],
  },
  //survey form 
  {
  id: 9,
  title: "Survey questions",
  description:
    "Please take a moment to complete this quick question survey. We value your feedback and have designed this survey as a way to know you better. Thank you for participating!",
  category: "survey",
  theme: "query",
  layout: "stacked",
  type: "survey",
  pages: [
    {
      id: 1,
      label: "Page 1",
      open: true,
      rows: [],
      rootElements: [
        {
          id: 901,
          label: "1. Are you?",
          type: "radio",
          required: true,
          options: ["Male", "Female"],
          elements: [],
        },
        {
          id: 902,
          label: "2. What is your age demographic?",
          type: "radio",
          required: true,
          options: ["20-39", "30-39", "40-49", "50-59", "60-69", "70+"],
          elements: [],
        },
        {
          id: 903,
          label: "3. How did you hear about us",
          type: "radio",
          required: true,
          options: [
            "Social Media",
            "Referred by a friend",
            "News/Media",
            "Other",
          ],
          elements: [],
        },
        {
          id: 904,
          label: "4. Why did you choose to buy from us?",
          type: "textarea",
          required: true,
          elements: [],
        },
        {
          id: 905,
          label: "5. Email address",
          type: "email",
          required: true,
          elements: [],
        },
      ],
      submitButton: {
        label: "Submit",
        enabled: true,
      },
    },
  ],
}
];