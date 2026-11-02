
import React, { useEffect, useState } from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";

import {
    Table,
    TableRow,
    TableHeader,
    TableCell,
} from "@tiptap/extension-table";

import "./RichTextEditor.css";

// Keep extensions outside the component.
// This prevents recreating the extension configuration on every render.
const extensions = [
    StarterKit,
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
    TextAlign.configure({
        types: ["heading", "paragraph"],
    }),
    Image,
    Table.configure({
        resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
];

export default function RichTextEditor({ value = "", onChange }) {
    const [showHtml, setShowHtml] = useState(false);
    const [htmlValue, setHtmlValue] = useState("");
    const [showMore, setShowMore] = useState(false);

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions,
        content: value || "<p></p>",

        onUpdate: ({ editor }) => {
            const html = editor.getHTML();

            onChange?.(html);
            setHtmlValue(html);
        },
    });

    // Update editor if content changes from outside.
    useEffect(() => {
        if (!editor) return;

        const currentHTML = editor.getHTML();

        if (value !== currentHTML) {
            editor.commands.setContent(value || "<p></p>", {
                emitUpdate: false,
            });

            setHtmlValue(value || "<p></p>");
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    // Prevent toolbar buttons from removing the current text selection.
    const preventToolbarFocus = (event) => {
        event.preventDefault();
    };

    // Get currently selected text format.
    const getCurrentFormat = () => {
        if (editor.isActive("blockquote")) {
            return "blockquote";
        }

        if (editor.isActive("heading")) {
            return `h${editor.getAttributes("heading").level}`;
        }

        return "paragraph";
    };

    // Change paragraph / heading / blockquote.
    const changeFormat = (event) => {
        const format = event.target.value;
        const chain = editor.chain().focus();

        if (format === "paragraph") {
            chain.setParagraph().run();
        } else if (format === "blockquote") {
            chain.setBlockquote().run();
        } else {
            chain.setHeading({
                level: Number(format.replace("h", "")),
            }).run();
        }
    };

    // Switch between visual editor and HTML source.
    const toggleHtml = () => {
        if (!showHtml) {
            setHtmlValue(editor.getHTML());
            setShowHtml(true);
        } else {
            editor.commands.setContent(htmlValue || "<p></p>");

            onChange?.(htmlValue || "<p></p>");

            setShowHtml(false);
        }
    };

    // Change HTML source without resetting the cursor on every keystroke.
    const updateHtml = (html) => {
        setHtmlValue(html);
    };

    // Insert an image using an image URL.
    const insertImage = () => {
        const url = window.prompt("Enter image URL");

        if (url) {
            editor.chain().focus().setImage({
                src: url,
            }).run();
        }

        setShowMore(false);
    };

    // Insert a hyperlink.
    const insertLink = () => {
        const previousUrl = editor.getAttributes("link").href || "";
        const url = window.prompt("Enter link URL", previousUrl);

        if (url === null) return;

        if (url.trim() === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({
                href: url,
            }).run();
        }
    };

    // Insert a 3 x 3 table.
    const insertTable = () => {
        editor.chain().focus().insertTable({
            rows: 3,
            cols: 3,
            withHeaderRow: true,
        }).run();

        setShowMore(false);
    };

    return (
        <div className="rich-editor">

            {/* ================= TOOLBAR ================= */}

            <div className="rich-editor-toolbar">

                {/* Bold */}
                <button
                    type="button"
                    title="Bold"
                    className={editor.isActive("bold") ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={() =>
                        editor.chain().focus().toggleBold().run()
                    }
                >
                    <b>B</b>
                </button>

                {/* Italic */}
                <button
                    type="button"
                    title="Italic"
                    className={editor.isActive("italic") ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                    }
                >
                    <i>I</i>
                </button>

                {/* Underline */}
                <button
                    type="button"
                    title="Underline"
                    className={editor.isActive("underline") ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                >
                    <u>U</u>
                </button>

                <span className="rich-editor-divider" />

                {/* Link */}
                <button
                    type="button"
                    title="Insert link"
                    className={editor.isActive("link") ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={insertLink}
                >
                    <span>🔗</span>
                </button>

                <span className="rich-editor-divider" />

                {/* Heading / Paragraph dropdown */}
                <select
                    aria-label="Text format"
                    title="Text format"
                    value={getCurrentFormat()}
                    onChange={changeFormat}
                >
                    <option value="paragraph">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                    <option value="h5">Heading 5</option>
                    <option value="h6">Heading 6</option>
                    <option value="blockquote">Blockquote</option>
                </select>

                <span className="rich-editor-divider" />

                {/* Text color */}
                <label
                    className="rich-editor-color"
                    title="Text color"
                >
                    <span>A</span>

                    <input
                        type="color"
                        aria-label="Text color"
                        onChange={(event) => {
                            editor.chain()
                                .focus()
                                .setColor(event.target.value)
                                .run();
                        }}
                    />
                </label>

                {/* Background color */}
                <label
                    className="rich-editor-color"
                    title="Background color"
                >
                    <span className="highlight-icon">▰</span>

                    <input
                        type="color"
                        aria-label="Background color"
                        onChange={(event) => {
                            editor.chain()
                                .focus()
                                .setHighlight({
                                    color: event.target.value,
                                })
                                .run();
                        }}
                    />
                </label>

                <div className="rich-editor-spacer" />

                {/* Three-dot menu */}

                <div className="rich-editor-more-wrapper">

                    <button
                        type="button"
                        title="Additional controls"
                        className={showMore ? "active" : ""}
                        onMouseDown={preventToolbarFocus}
                        onClick={() => setShowMore(!showMore)}
                    >
                        •••
                    </button>

                    {showMore && (
                        <div className="rich-editor-overflow-menu">

                            {/* Alignment */}
                            <div className="rich-editor-menu-group">
                                <button
                                    type="button"
                                    title="Align left"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign("left").run();
                                        setShowMore(false);
                                    }}
                                >
                                    <span>☰</span>
                                </button>

                                <button
                                    type="button"
                                    title="Align center"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign("center").run();
                                        setShowMore(false);
                                    }}
                                >
                                    <span>☷</span>
                                </button>

                                <button
                                    type="button"
                                    title="Align right"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign("right").run();
                                        setShowMore(false);
                                    }}
                                >
                                    <span>☰</span>
                                </button>
                            </div>

                            {/* Image, video and table */}
                            <div className="rich-editor-menu-group rich-editor-section-break">

                                <button
                                    type="button"
                                    title="Insert image"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={insertImage}
                                >
                                    ▧
                                </button>

                                <button
                                    type="button"
                                    title="Insert video"
                                    disabled
                                >
                                    ▷
                                </button>

                                <button
                                    type="button"
                                    title="Insert table"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={insertTable}
                                >
                                    ▦
                                </button>

                            </div>

                            {/* Lists and indentation */}
                            <div className="rich-editor-menu-group">

                                <button
                                    type="button"
                                    title="Bulleted list"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        editor.chain().focus().toggleBulletList().run();
                                        setShowMore(false);
                                    }}
                                >
                                    •☰
                                </button>

                                <button
                                    type="button"
                                    title="Numbered list"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        editor.chain().focus().toggleOrderedList().run();
                                        setShowMore(false);
                                    }}
                                >
                                    1☰
                                </button>

                                <button
                                    type="button"
                                    title="Outdent"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        // Placeholder until list indentation support is added.
                                    }}
                                >
                                    ⇤
                                </button>

                                <button
                                    type="button"
                                    title="Indent"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        // Placeholder until list indentation support is added.
                                    }}
                                >
                                    ⇥
                                </button>

                            </div>

                            {/* Clear formatting */}
                            <div className="rich-editor-menu-group">

                                <button
                                    type="button"
                                    title="Clear formatting"
                                    onMouseDown={preventToolbarFocus}
                                    onClick={() => {
                                        editor.chain()
                                            .focus()
                                            .unsetAllMarks()
                                            .clearNodes()
                                            .run();

                                        setShowMore(false);
                                    }}
                                >
                                    ⊘
                                </button>

                            </div>

                        </div>
                    )}

                </div>


                <span className="rich-editor-divider" />

                {/* HTML source */}
                <button
                    type="button"
                    title={showHtml ? "Show editor" : "Show HTML"}
                    className={showHtml ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={toggleHtml}
                >
                    {"</>"}
                </button>

            </div>

            {/* ================= EDITOR CONTENT ================= */}

            {showHtml ? (

                <textarea
                    className="rich-editor-html"
                    value={htmlValue}
                    onChange={(event) => updateHtml(event.target.value)}
                    spellCheck={false}
                    aria-label="HTML source"
                />

            ) : (

                <EditorContent editor={editor} />

            )}

        </div>
    );
}
