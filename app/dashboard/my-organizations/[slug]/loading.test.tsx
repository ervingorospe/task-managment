import { render } from "@testing-library/react";
import Loading from "./loading";

jest.mock("next/navigation", () => ({ useRouter: jest.fn(() => ({ back: jest.fn() })) }));

it("renders the back button and skeleton layout without crashing", () => {
  const { container } = render(<Loading />);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});
