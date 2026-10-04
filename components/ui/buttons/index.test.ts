import { InlineButton, BackButton, Button, IconButton } from "./index";

it("re-exports every button component", () => {
  expect(InlineButton).toBeDefined();
  expect(BackButton).toBeDefined();
  expect(Button).toBeDefined();
  expect(IconButton).toBeDefined();
});
