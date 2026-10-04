import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import BackButton from "./button-back";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;

it("calls router.back() when clicked", async () => {
  const back = jest.fn();
  mockedUseRouter.mockReturnValue({ back });
  render(<BackButton />);
  await userEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(back).toHaveBeenCalledTimes(1);
});
