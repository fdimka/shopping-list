import { describe, it, expect } from "vitest";
import { cartSlice, addItem, clearCart } from "../src/store";
import { validateCustomer } from "../src/validation";
const item = {
  id: 1,
  name: "חלב",
  categoryId: 1,
  categoryName: "חלב וגבינות",
  quantity: 2,
};
describe("cart", () => {
  it("merges repeated products", () => {
    let s = cartSlice.reducer(undefined, addItem(item));
    s = cartSlice.reducer(s, addItem({ ...item, quantity: 3 }));
    s = cartSlice.reducer(s, addItem({ ...item, id: 2 }));
    expect(s.items.map((i) => i.quantity)).toEqual([5, 2]);
    expect(cartSlice.reducer(s, clearCart()).items).toEqual([]);
  });
  it("rejects invalid quantities", () => {
    for (const quantity of [0, -1, 1.5, 1000])
      expect(
        cartSlice.reducer(undefined, addItem({ ...item, quantity })).items,
      ).toEqual([]);
  });
});
it("validates customer fields", () => {
  expect(Object.keys(validateCustomer("", "", ""))).toHaveLength(3);
  expect(
    validateCustomer("דמיטרי פרידמן", "הרצל 10 תל אביב", "test@example.com"),
  ).toEqual({});
  expect(validateCustomer("דמיטרי", "הרצל 10", "bad").fullName).toBeTruthy();
  expect(validateCustomer("John Smith", "     ", "bad").email).toBeTruthy();
});
