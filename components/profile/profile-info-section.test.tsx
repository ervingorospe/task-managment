import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileInfoSection from "./profile-info-section";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { updateUser, uploadUserAvatar } from "@/lib/api/users";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/providers/toast-provider", () => ({ useToast: jest.fn() }));
jest.mock("@/lib/api/users", () => ({
  updateUser: jest.fn(),
  uploadUserAvatar: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedUpdateUser = updateUser as jest.Mock;
const mockedUploadAvatar = uploadUserAvatar as jest.Mock;

const CURRENT_USER = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@acmestudio.com",
  avatar: null,
};

const toast = jest.fn();
const updateProfile = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseToast.mockReturnValue(toast);
  mockedUseAuth.mockReturnValue({ currentUser: CURRENT_USER, updateProfile });
});

it("renders nothing when there's no current user", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null, updateProfile });
  const { container } = render(<ProfileInfoSection />);
  expect(container).toBeEmptyDOMElement();
});

it("shows the read-only view with the current name and email", () => {
  render(<ProfileInfoSection />);
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText("jane@acmestudio.com")).toBeInTheDocument();
  expect(screen.queryByLabelText(/First Name/)).toBeNull();
});

it("enters edit mode, pre-filled with the current values", async () => {
  render(<ProfileInfoSection />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  expect(screen.getByLabelText(/First Name/)).toHaveValue("Jane");
  expect(screen.getByLabelText(/Last Name/)).toHaveValue("Doe");
  expect(screen.getByLabelText(/Email/)).toHaveValue("jane@acmestudio.com");
});

it("cancels editing without saving", async () => {
  render(<ProfileInfoSection />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.clear(screen.getByLabelText(/First Name/));
  await userEvent.type(screen.getByLabelText(/First Name/), "Janet");
  await userEvent.click(screen.getByRole("button", { name: /Cancel/ }));
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(mockedUpdateUser).not.toHaveBeenCalled();
});

it("does nothing (just closes) when Save is clicked with no changes", async () => {
  render(<ProfileInfoSection />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.click(screen.getByRole("button", { name: /Save/ }));
  expect(mockedUpdateUser).not.toHaveBeenCalled();
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
});

it("saves changed fields and updates the current user on success", async () => {
  mockedUpdateUser.mockResolvedValue(undefined);
  render(<ProfileInfoSection />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.clear(screen.getByLabelText(/First Name/));
  await userEvent.type(screen.getByLabelText(/First Name/), "Janet");
  await userEvent.click(screen.getByRole("button", { name: /Save/ }));

  // The mocked useAuth doesn't actually update currentUser on
  // updateProfile() the way the real AuthProvider would — what's
  // verifiable here is that editing closed and the right calls were made.
  expect(await screen.findByRole("button", { name: /Edit/ })).toBeInTheDocument();
  expect(mockedUpdateUser).toHaveBeenCalledWith(1, {
    firstName: "Janet",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    avatar: null,
  });
  expect(updateProfile).toHaveBeenCalledWith({
    firstName: "Janet",
    lastName: "Doe",
    email: "jane@acmestudio.com",
    avatar: null,
  });
  expect(toast).toHaveBeenCalledWith("Profile updated");
});

it("uploads a new avatar before saving when one was picked", async () => {
  mockedUploadAvatar.mockResolvedValue("https://cdn/new.png");
  mockedUpdateUser.mockResolvedValue(undefined);
  render(<ProfileInfoSection />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));

  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const avatarFile = new File(["x"], "avatar.png", { type: "image/png" });
  URL.createObjectURL = jest.fn().mockReturnValue("blob:preview");
  URL.revokeObjectURL = jest.fn();
  await userEvent.upload(fileInput, avatarFile);

  await userEvent.click(screen.getByRole("button", { name: /Save/ }));

  await screen.findByText("Jane Doe");
  expect(mockedUploadAvatar).toHaveBeenCalledWith(1, avatarFile);
  expect(mockedUpdateUser).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ avatar: "https://cdn/new.png" }),
  );
});

it("toasts an error and stays in edit mode when saving fails", async () => {
  mockedUpdateUser.mockRejectedValue(new Error("boom"));
  render(<ProfileInfoSection />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.clear(screen.getByLabelText(/First Name/));
  await userEvent.type(screen.getByLabelText(/First Name/), "Janet");
  await userEvent.click(screen.getByRole("button", { name: /Save/ }));

  await screen.findByRole("button", { name: /Save/ });
  expect(toast).toHaveBeenCalled();
  expect(updateProfile).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
});

it("disables Cancel/Save while saving", async () => {
  let resolveUpdate: () => void;
  mockedUpdateUser.mockReturnValue(new Promise<void>((resolve) => (resolveUpdate = resolve)));
  render(<ProfileInfoSection />);
  await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
  await userEvent.clear(screen.getByLabelText(/First Name/));
  await userEvent.type(screen.getByLabelText(/First Name/), "Janet");
  await userEvent.click(screen.getByRole("button", { name: /Save/ }));

  expect(screen.getByRole("button", { name: /Saving/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /Cancel/ })).toBeDisabled();
  resolveUpdate!();
});
