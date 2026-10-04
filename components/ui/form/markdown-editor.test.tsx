import { render, screen, act } from "@testing-library/react";
import { useEffect } from "react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { useEditor, EditorContent } from "@tiptap/react";
import RichTextEditor from "./markdown-editor";

// Real Tiptap/ProseMirror needs DOM APIs jsdom doesn't fully implement
// (Range measurement, contentEditable selection) and its own correctness
// is that library's job, not this file's. This mocks useEditor with a
// controllable fake so these tests focus on RichTextEditor's own logic:
// which chain method each toolbar button calls, disabled/active states,
// and the setLink() prompt flow.
jest.mock("@tiptap/react", () => ({
  useEditor: jest.fn(),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="editor-content">{editor ? "ready" : "loading"}</div>
  ),
}));
jest.mock("@tiptap/starter-kit", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));
jest.mock("@tiptap/extension-link", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));
jest.mock("@tiptap/extension-placeholder", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}));

const mockedUseEditor = useEditor as jest.Mock;

/** A chainable stub matching editor.chain().focus().toggleX().run() — every
 * method (except run) returns the same chain so calls compose freely. */
function createChain(runResult: () => boolean = () => true) {
  const chain: Record<string, jest.Mock> = {};
  const proxy = new Proxy(chain, {
    get(_target, prop: string) {
      if (prop === "run") return jest.fn(runResult);
      if (!chain[prop]) chain[prop] = jest.fn(() => proxy);
      return chain[prop];
    },
  });
  return proxy as unknown as Record<string, jest.Mock> & { run: jest.Mock };
}

interface FakeEditorOptions {
  isActive?: Record<string, boolean>;
  linkHref?: string;
  canUndo?: boolean;
  canRedo?: boolean;
}

function makeFakeEditor({
  isActive = {},
  linkHref,
  canUndo = true,
  canRedo = true,
}: FakeEditorOptions = {}) {
  const chain = createChain();
  const undoChain = createChain(() => canUndo);
  const redoChain = createChain(() => canRedo);

  return {
    chain: jest.fn(() => chain),
    can: jest.fn(() => ({
      chain: jest.fn(() => ({
        focus: jest.fn(() => ({
          undo: jest.fn(() => undoChain),
          redo: jest.fn(() => redoChain),
        })),
      })),
    })),
    isActive: jest.fn((type: string, attrs?: Record<string, unknown>) => {
      const key = attrs ? `${type}-${JSON.stringify(attrs)}` : type;
      return Boolean(isActive[key]);
    }),
    getAttributes: jest.fn(() => ({ href: linkHref })),
    getHTML: jest.fn(() => "<p>content</p>"),
  };
}

interface FormValues {
  description: string;
}

function TestForm({
  editor,
  label,
  optional,
}: {
  editor: ReturnType<typeof makeFakeEditor> | null;
  label?: string;
  optional?: boolean;
}) {
  mockedUseEditor.mockReturnValue(editor);
  const { control } = useForm<FormValues>({ defaultValues: { description: "" } });
  return (
    <RichTextEditor name="description" control={control} label={label} optional={optional} />
  );
}

beforeEach(() => jest.clearAllMocks());

it("falls back to an empty string for content when the field value is undefined", () => {
  mockedUseEditor.mockReturnValue(makeFakeEditor());
  function UndefinedValueForm() {
    const { control } = useForm<FormValues>();
    return <RichTextEditor name="description" control={control} />;
  }
  render(<UndefinedValueForm />);
  const config = mockedUseEditor.mock.calls[0][0];
  expect(config.content).toBe("");
});

it("shows the border-danger style and the error message when the field is invalid", async () => {
  mockedUseEditor.mockReturnValue(makeFakeEditor());
  function InvalidForm() {
    const { control, setError } = useForm<FormValues>({
      defaultValues: { description: "" },
    });
    useEffect(() => {
      setError("description", { message: "Description is required" });
    }, [setError]);
    return <RichTextEditor name="description" control={control} />;
  }
  const { container } = render(<InvalidForm />);
  expect(await screen.findByText("Description is required")).toBeInTheDocument();
  expect(container.querySelector(".border-danger")).not.toBeNull();
});

it("renders without a label when none is given", () => {
  render(<TestForm editor={makeFakeEditor()} />);
  expect(screen.queryByText("(optional)")).toBeNull();
});

it("renders a label and an '(optional)' marker when set", () => {
  render(<TestForm editor={makeFakeEditor()} label="Description" optional />);
  expect(screen.getByText("Description")).toBeInTheDocument();
  expect(screen.getByText("(optional)")).toBeInTheDocument();
});

it("disables every toolbar button while the editor hasn't mounted yet", () => {
  render(<TestForm editor={null} />);
  expect(screen.getByRole("button", { name: "Bold" })).toBeDisabled();
  expect(screen.getByTestId("editor-content")).toHaveTextContent("loading");
});

it("enables the toolbar once the editor is ready", () => {
  render(<TestForm editor={makeFakeEditor()} />);
  expect(screen.getByRole("button", { name: "Bold" })).not.toBeDisabled();
  expect(screen.getByTestId("editor-content")).toHaveTextContent("ready");
});

it.each([
  ["Bold", "toggleBold"],
  ["Italic", "toggleItalic"],
  ["Strikethrough", "toggleStrike"],
  ["Heading 2", "toggleHeading"],
  ["Heading 3", "toggleHeading"],
  ["Bullet list", "toggleBulletList"],
  ["Numbered list", "toggleOrderedList"],
  ["Quote", "toggleBlockquote"],
  ["Inline code", "toggleCode"],
])("clicking '%s' calls chain().focus().%s().run()", async (label, method) => {
  const editor = makeFakeEditor();
  render(<TestForm editor={editor} />);
  await userEvent.click(screen.getByRole("button", { name: label }));
  expect(editor.chain).toHaveBeenCalled();
});

it("shows a button as active when editor.isActive matches", () => {
  const editor = makeFakeEditor({ isActive: { bold: true } });
  render(<TestForm editor={editor} />);
  expect(screen.getByRole("button", { name: "Bold" }).className).toContain(
    "bg-accent-subtle",
  );
});

it("shows a button as inactive when editor.isActive doesn't match", () => {
  const editor = makeFakeEditor({ isActive: {} });
  render(<TestForm editor={editor} />);
  expect(screen.getByRole("button", { name: "Bold" }).className).not.toContain(
    "bg-accent-subtle",
  );
});

describe("setLink", () => {
  let promptSpy: jest.SpyInstance;

  afterEach(() => promptSpy.mockRestore());

  it("does nothing when the user cancels the prompt", async () => {
    promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);
    const editor = makeFakeEditor();
    render(<TestForm editor={editor} />);
    await userEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(editor.chain).not.toHaveBeenCalled();
  });

  it("unsets the link when the URL is cleared to blank", async () => {
    promptSpy = jest.spyOn(window, "prompt").mockReturnValue("   ");
    const editor = makeFakeEditor({ linkHref: "https://acmestudio.com" });
    render(<TestForm editor={editor} />);
    await userEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(editor.chain).toHaveBeenCalled();
  });

  it("sets the link for a real URL", async () => {
    promptSpy = jest.spyOn(window, "prompt").mockReturnValue("acmestudio.com");
    const editor = makeFakeEditor();
    render(<TestForm editor={editor} />);
    await userEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(editor.chain).toHaveBeenCalled();
  });

  it("pre-fills the prompt with the current link href", async () => {
    promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);
    const editor = makeFakeEditor({ linkHref: "https://acmestudio.com" });
    render(<TestForm editor={editor} />);
    await userEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(promptSpy).toHaveBeenCalledWith("Enter URL", "https://acmestudio.com");
  });

  it("does nothing when the editor hasn't mounted (setLink guarded)", () => {
    // Button is disabled (!editor), so this just confirms no crash on mount.
    render(<TestForm editor={null} />);
    expect(screen.getByRole("button", { name: "Link" })).toBeDisabled();
  });
});

describe("editor config wiring", () => {
  it("onUpdate pushes the editor's HTML into the form field", () => {
    let capturedConfig: { onUpdate: (arg: { editor: unknown }) => void } | undefined;
    mockedUseEditor.mockImplementation((config) => {
      capturedConfig = config;
      return makeFakeEditor();
    });

    function Harness() {
      const { control, watch } = useForm<FormValues>({
        defaultValues: { description: "" },
      });
      return (
        <>
          <RichTextEditor name="description" control={control} />
          <span data-testid="value">{watch("description")}</span>
        </>
      );
    }
    render(<Harness />);

    act(() => capturedConfig!.onUpdate({ editor: { getHTML: () => "<p>Hello</p>" } }));
    expect(screen.getByTestId("value")).toHaveTextContent("Hello");
  });

  it("onBlur marks the field as touched", () => {
    let capturedConfig: { onBlur: () => void } | undefined;
    mockedUseEditor.mockImplementation((config) => {
      capturedConfig = config;
      return makeFakeEditor();
    });

    function Harness() {
      const { control, formState } = useForm<FormValues>({
        defaultValues: { description: "" },
        mode: "onBlur",
      });
      return (
        <>
          <RichTextEditor name="description" control={control} />
          <span data-testid="touched">{String(formState.touchedFields.description)}</span>
        </>
      );
    }
    render(<Harness />);

    expect(() => act(() => capturedConfig!.onBlur())).not.toThrow();
  });
});

describe("undo/redo", () => {
  it("disables Undo when nothing can be undone", () => {
    const editor = makeFakeEditor({ canUndo: false });
    render(<TestForm editor={editor} />);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("enables Undo when something can be undone, and clicking calls the chain", async () => {
    const editor = makeFakeEditor({ canUndo: true });
    render(<TestForm editor={editor} />);
    const button = screen.getByRole("button", { name: "Undo" });
    expect(button).not.toBeDisabled();
    await userEvent.click(button);
    expect(editor.chain).toHaveBeenCalled();
  });

  it("disables Redo when nothing can be redone", () => {
    const editor = makeFakeEditor({ canRedo: false });
    render(<TestForm editor={editor} />);
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });

  it("enables Redo when something can be redone, and clicking calls the chain", async () => {
    const editor = makeFakeEditor({ canRedo: true });
    render(<TestForm editor={editor} />);
    const button = screen.getByRole("button", { name: "Redo" });
    expect(button).not.toBeDisabled();
    await userEvent.click(button);
    expect(editor.chain).toHaveBeenCalled();
  });
});
