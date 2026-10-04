import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import FileAttachmentInput from "./file-attachment-input";

interface FormValues {
  attachments: File[];
}

function TestForm() {
  const { control } = useForm<FormValues>({ defaultValues: { attachments: [] } });
  return <FileAttachmentInput name="attachments" control={control} />;
}

function file(name: string, sizeBytes: number) {
  const f = new File(["x".repeat(1)], name);
  Object.defineProperty(f, "size", { value: sizeBytes });
  return f;
}

it("uses the default 'Attachments' label and shows 0/5 with no files", () => {
  const { container } = render(<TestForm />);
  expect(container.querySelector("label")).toHaveTextContent("Attachments (optional)");
  expect(screen.getByText("0 / 5 · max 50MB each")).toBeInTheDocument();
});

it("accepts a custom label", () => {
  function CustomLabelForm() {
    const { control } = useForm<FormValues>({ defaultValues: { attachments: [] } });
    return <FileAttachmentInput name="attachments" control={control} label="Files" />;
  }
  const { container } = render(<CustomLabelForm />);
  expect(container.querySelector("label")).toHaveTextContent("Files (optional)");
});

it("clicking the trigger button opens the hidden file picker", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const clickSpy = jest.spyOn(input, "click");
  await userEvent.click(screen.getByRole("button", { name: "Attach files" }));
  expect(clickSpy).toHaveBeenCalledTimes(1);
});

it("does nothing when the file input changes with no file selected", () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [] } });
  expect(screen.getByText("0 / 5 · max 50MB each")).toBeInTheDocument();
});

it("adds a selected file to the list, showing its size in KB", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file("screenshot.png", 500 * 1024));
  expect(screen.getByText(/screenshot\.png/)).toBeInTheDocument();
  expect(screen.getByText(/500 KB/)).toBeInTheDocument();
  expect(screen.getByText("1 / 5 · max 50MB each")).toBeInTheDocument();
});

it("shows a file's size in MB when at least 1MB", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file("recording.mov", 2.5 * 1024 * 1024));
  expect(screen.getByText(/2\.5 MB/)).toBeInTheDocument();
});

it("removes a file when its remove button is clicked", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file("screenshot.png", 500 * 1024));
  expect(screen.getByText(/screenshot\.png/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "" }));
  expect(screen.queryByText(/screenshot\.png/)).toBeNull();
  expect(screen.getByText("0 / 5 · max 50MB each")).toBeInTheDocument();
});

it("silently drops files over 50MB at selection time", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, [
    file("small.png", 1024),
    file("huge.mov", 51 * 1024 * 1024),
  ]);
  expect(screen.getByText(/small\.png/)).toBeInTheDocument();
  expect(screen.queryByText(/huge\.mov/)).toBeNull();
  expect(screen.getByText("1 / 5 · max 50MB each")).toBeInTheDocument();
});

it("truncates a selection that would exceed the remaining room", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, [
    file("a.png", 1024),
    file("b.png", 1024),
    file("c.png", 1024),
    file("d.png", 1024),
    file("e.png", 1024),
    file("f.png", 1024),
  ]);
  expect(screen.getByText("5 / 5 · max 50MB each")).toBeInTheDocument();
  expect(screen.queryByText(/f\.png/)).toBeNull();
});

it("disables the trigger button and shows 'File limit reached' at 5 files", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, [
    file("a.png", 1024),
    file("b.png", 1024),
    file("c.png", 1024),
    file("d.png", 1024),
    file("e.png", 1024),
  ]);
  const trigger = screen.getByRole("button", { name: /File limit reached/ });
  expect(trigger).toBeDisabled();
});
