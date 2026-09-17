"use client";

import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";

type RichTextEditorProps<
  T extends FieldValues,
  N extends FieldPath<T> = FieldPath<T>,
> = {
  name: N;
  control: Control<T>;
  label?: string;
  optional?: boolean;
  placeholder?: string;
};

export default function RichTextEditor<T extends FieldValues>({
  name,
  control,
  label,
  optional,
  placeholder = "Start writing...",
}: RichTextEditorProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),

      Placeholder.configure({
        placeholder,
      }),
    ],

    content: field.value ?? "",

    onUpdate: ({ editor }) => {
      field.onChange(editor.getHTML());
    },

    onBlur: () => {
      field.onBlur();
    },

    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  function setLink() {
    if (!editor) return;

    const currentUrl = editor.getAttributes("link").href;

    const url = window.prompt("Enter URL", currentUrl ?? "");

    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: url.trim(),
      })
      .run();
  }

  const buttonClass = (active = false) =>
    [
      "inline-flex h-7 w-7 items-center justify-center rounded",
      "transition-colors",
      "disabled:pointer-events-none disabled:opacity-30",
      active
        ? "bg-accent-subtle text-accent-text"
        : "text-ink-muted hover:bg-canvas hover:text-ink",
    ].join(" ");

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-ink">
          {label}
          {optional && <span className="ml-1 text-ink-faint">(optional)</span>}
        </label>
      )}

      <div
        className={[
          "overflow-hidden rounded border bg-surface",
          error ? "border-danger" : "border-line",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
          <button
            type="button"
            title="Bold"
            aria-label="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
            className={buttonClass(editor?.isActive("bold"))}
          >
            <Bold size={14} />
          </button>

          <button
            type="button"
            title="Italic"
            aria-label="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor}
            className={buttonClass(editor?.isActive("italic"))}
          >
            <Italic size={14} />
          </button>

          <button
            type="button"
            title="Strikethrough"
            aria-label="Strikethrough"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!editor}
            className={buttonClass(editor?.isActive("strike"))}
          >
            <Strikethrough size={14} />
          </button>

          <ToolbarDivider />

          <button
            type="button"
            title="Heading 2"
            aria-label="Heading 2"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            disabled={!editor}
            className={buttonClass(editor?.isActive("heading", { level: 2 }))}
          >
            <Heading2 size={14} />
          </button>

          <button
            type="button"
            title="Heading 3"
            aria-label="Heading 3"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
            disabled={!editor}
            className={buttonClass(editor?.isActive("heading", { level: 3 }))}
          >
            <Heading3 size={14} />
          </button>

          <button
            type="button"
            title="Bullet list"
            aria-label="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor}
            className={buttonClass(editor?.isActive("bulletList"))}
          >
            <List size={14} />
          </button>

          <button
            type="button"
            title="Numbered list"
            aria-label="Numbered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor}
            className={buttonClass(editor?.isActive("orderedList"))}
          >
            <ListOrdered size={14} />
          </button>

          <ToolbarDivider />

          <button
            type="button"
            title="Quote"
            aria-label="Quote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            disabled={!editor}
            className={buttonClass(editor?.isActive("blockquote"))}
          >
            <Quote size={14} />
          </button>

          <button
            type="button"
            title="Inline code"
            aria-label="Inline code"
            onClick={() => editor?.chain().focus().toggleCode().run()}
            disabled={!editor}
            className={buttonClass(editor?.isActive("code"))}
          >
            <Code size={14} />
          </button>

          <button
            type="button"
            title="Link"
            aria-label="Link"
            onClick={setLink}
            disabled={!editor}
            className={buttonClass(editor?.isActive("link"))}
          >
            <Link2 size={14} />
          </button>

          <ToolbarDivider />

          <button
            type="button"
            title="Undo"
            aria-label="Undo"
            disabled={!editor?.can().chain().focus().undo().run()}
            onClick={() => editor?.chain().focus().undo().run()}
            className={buttonClass()}
          >
            <Undo2 size={14} />
          </button>

          <button
            type="button"
            title="Redo"
            aria-label="Redo"
            disabled={!editor?.can().chain().focus().redo().run()}
            onClick={() => editor?.chain().focus().redo().run()}
            className={buttonClass()}
          >
            <Redo2 size={14} />
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>

      {error?.message && (
        <p className="mt-1 text-xs text-danger">{error.message}</p>
      )}
    </div>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-4 w-px bg-line" />;
}
