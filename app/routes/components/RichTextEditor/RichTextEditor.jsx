
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import "./RichTextEditor.css";

export default function RichTextEditor({ value = "", onChange }) {
    const [showHtml, setShowHtml] = useState(false);
    const [htmlValue, setHtmlValue] = useState("");

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content: value || "<p></p>",
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange?.(html);
            setHtmlValue(html);
        },
    });

    // Update editor when content changes externally.
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

    if (!editor) return null;

    const preventToolbarFocus = (event) => {
        event.preventDefault();
    };

    const getCurrentFormat = () => {
        if (editor.isActive("blockquote")) return "blockquote";

        if (editor.isActive("heading")) {
            return `h${editor.getAttributes("heading").level}`;
        }

        return "paragraph";
    };

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

    const toggleHtml = () => {
        if (!showHtml) {
            setHtmlValue(editor.getHTML());
        } else {
            editor.commands.setContent(htmlValue || "<p></p>");
            onChange?.(htmlValue || "<p></p>");
        }

        setShowHtml(!showHtml);
    };

    const updateHtml = (html) => {
        setHtmlValue(html);
        editor.commands.setContent(html, {
            emitUpdate: false,
        });
        onChange?.(html);
    };

    return (
        <div className="rich-editor">
            <div className="rich-editor-toolbar">

                {/* Bold */}
                <button
                    type="button"
                    title="Bold"
                    className={editor.isActive("bold") ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <b>B</b>
                </button>

                {/* Italic */}
                <button
                    type="button"
                    title="Italic"
                    className={editor.isActive("italic") ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <i>I</i>
                </button>

                {/* Underline */}
                <button
                    type="button"
                    title="Underline"
                    className={editor.isActive("underline") ? "active" : ""}
                    onMouseDown={preventToolbarFocus}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <u>U</u>
                </button>

                <span className="rich-editor-divider" />

                {/* Format dropdown */}
                <select
                    aria-label="Text format"
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
                <label className="rich-editor-color" title="Text color">
                    <span>A</span>
                    <input
                        type="color"
                        aria-label="Text color"
                        onChange={(event) =>
                            editor.chain()
                                .focus()
                                .setColor(event.target.value)
                                .run()
                        }
                    />
                </label>

                {/* Text background / highlight */}
                <label className="rich-editor-color" title="Background color">
                    <span className="highlight-icon">▰</span>
                    <input
                        type="color"
                        aria-label="Background color"
                        onChange={(event) =>
                            editor.chain()
                                .focus()
                                .setHighlight({ color: event.target.value })
                                .run()
                        }
                    />
                </label>

                <span className="rich-editor-divider" />

                {/* Clear formatting */}
                <button
                    type="button"
                    title="Clear formatting"
                    onMouseDown={preventToolbarFocus}
                    onClick={() =>
                        editor.chain().focus().unsetAllMarks().clearNodes().run()
                    }
                >
                    <span>Tx</span>
                </button>

                <div className="rich-editor-spacer" />

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
