import { render } from "@testing-library/react";
import Loading from "./loading";

jest.mock("next/navigation", () => ({ useRouter: jest.fn(() => ({ back: jest.fn() })) }));

it("renders all 5 step indicators with connectors between them, but not after the last", () => {
  const { container } = render(<Loading />);
  const circles = container.querySelectorAll(".rounded-full");
  expect(circles.length).toBe(5);
  const connectors = container.querySelectorAll(".h-px.w-8");
  expect(connectors.length).toBe(4);
});
