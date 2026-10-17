import { it, expect } from "vitest";
import { validateCustomer, hebrewInput } from "../src/validation";
it("requires Hebrew names and Hebrew addresses but allows address numbers", () => {
  expect(
    validateCustomer(
      "ישראל ישראלי",
      "הרצל 10, דירה 2 תל אביב",
      "test@example.com",
    ),
  ).toEqual({});
  for (const name of ["John Smith", "ישראל Smith", "ישראל", "123 456"])
    expect(
      validateCustomer(name, "הרצל 10", "test@example.com").fullName,
    ).toBeTruthy();
  for (const address of ["Herzl 10", "הרצל Tel Aviv 10", "12345", "😀😀😀😀😀"])
    expect(
      validateCustomer("ישראל ישראלי", address, "test@example.com").address,
    ).toBeTruthy();
  expect(hebrewInput("ישראל John 123")).toBe("ישראל  ");
  expect(hebrewInput("הרצל 10 Tel Aviv", true)).toBe("הרצל 10  ");
});
