import { AUTH_COOKIE_NAME } from "./auth-cookie.constant";

it("matches the backend's cookie name", () => {
  expect(AUTH_COOKIE_NAME).toBe("ticketing_auth");
});
