import { redirect } from "next/navigation";
import RootPage from "./page";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

it("redirects to the login page", () => {
  RootPage();
  expect(redirect).toHaveBeenCalledWith("/login");
});
