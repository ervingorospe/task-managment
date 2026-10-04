import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import AvatarUpload from "./avatar-upload";

interface FormValues {
  avatar: File | null;
}

function TestForm(props: Partial<React.ComponentProps<typeof AvatarUpload<FormValues>>> = {}) {
  const { control } = useForm<FormValues>({ defaultValues: { avatar: null } });
  return (
    <AvatarUpload
      name="avatar"
      control={control}
      firstName="Jane"
      lastName="Doe"
      {...props}
    />
  );
}

function file(name: string, sizeBytes: number) {
  const f = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(f, "size", { value: sizeBytes });
  return f;
}

// jsdom doesn't implement these at all (not even as a no-op), so they must
// be assigned directly rather than spied on with jest.spyOn.
let createObjectURLMock: jest.Mock;
let revokeObjectURLMock: jest.Mock;

beforeEach(() => {
  createObjectURLMock = jest.fn().mockReturnValue("blob:preview");
  revokeObjectURLMock = jest.fn();
  URL.createObjectURL = createObjectURLMock;
  URL.revokeObjectURL = revokeObjectURLMock;
});

it("shows the current avatar when no file is picked yet", () => {
  render(<TestForm currentSrc="https://cdn/current.png" />);
  expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("cdn"));
});

it("shows initials when there's no current avatar either", () => {
  render(<TestForm currentSrc={null} />);
  expect(screen.getByText("JD")).toBeInTheDocument();
});

it("previews a newly-picked file via an object URL", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file("avatar.png", 1024));
  expect(createObjectURLMock).toHaveBeenCalled();
  expect(screen.getByRole("img")).toHaveAttribute("src", "blob:preview");
});

it("rejects a file over 5MB (clears the field instead of setting it)", async () => {
  render(<TestForm currentSrc={null} />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file("huge.png", 6 * 1024 * 1024));
  // Rejected — falls back to showing initials, not a preview.
  expect(screen.getByText("JD")).toBeInTheDocument();
  expect(createObjectURLMock).not.toHaveBeenCalled();
});

it("does nothing when the file input changes with no file selected", () => {
  render(<TestForm currentSrc={null} />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [] } });
  expect(screen.getByText("JD")).toBeInTheDocument();
  expect(createObjectURLMock).not.toHaveBeenCalled();
});

it("opens the file picker when either 'Change avatar' control is clicked", async () => {
  render(<TestForm />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const clickSpy = jest.spyOn(input, "click");
  await userEvent.click(screen.getByRole("button", { name: "Change avatar" }));
  await userEvent.click(screen.getByRole("button", { name: "Change photo" }));
  expect(clickSpy).toHaveBeenCalledTimes(2);
});
