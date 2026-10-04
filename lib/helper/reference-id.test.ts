import { formatReferenceId } from "./reference-id";

it("pads the number to 5 digits with the given prefix", () => {
  expect(formatReferenceId("tckt", 1)).toBe("tckt-00001");
  expect(formatReferenceId("req", 42)).toBe("req-00042");
});

it("doesn't truncate a number already 5+ digits", () => {
  expect(formatReferenceId("tckt", 123456)).toBe("tckt-123456");
});
