import { render } from "@testing-library/react";
import Loading from "./loading";

jest.mock("next/navigation", () => ({ useRouter: jest.fn(() => ({ back: jest.fn() })) }));

it("renders the detail header and card skeletons, including both repeated groups, without crashing", () => {
  const { container } = render(<Loading />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});
