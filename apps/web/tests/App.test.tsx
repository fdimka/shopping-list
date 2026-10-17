import React from "react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { App } from "../src/App";
import { createStore } from "../src/store";
const categories = [
  {
    id: 1,
    name: "חלב וגבינות",
    products: [{ id: 2, name: "חלב", categoryId: 1 }],
  },
  { id: 2, name: "בשר", products: [{ id: 6, name: "שוקיים", categoryId: 2 }] },
];
beforeEach(() => {
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("hides placeholders, filters products, transfers cart and validates Hebrew input", async () => {
  let submitted: any;
  let fail = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes("/categories"))
        return { ok: true, json: async () => categories };
      submitted = JSON.parse(options!.body as string);
      return fail
        ? { ok: false, status: 503 }
        : { ok: true, json: async () => ({ id: "saved-order" }) };
    }),
  );
  render(
    <Provider store={createStore()}>
      <App />
    </Provider>,
  );
  await waitFor(() =>
    expect(
      (screen.getByLabelText("קטגוריה") as HTMLSelectElement).disabled,
    ).toBe(false),
  );
  expect((screen.getByText("בחר קטגוריה") as HTMLOptionElement).hidden).toBe(
    true,
  );
  expect((screen.getByText("שם מוצר") as HTMLOptionElement).hidden).toBe(true);
  fireEvent.change(screen.getByLabelText("קטגוריה"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText("מוצר"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("כמות"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "הוסף מוצר לסל" }));
  expect(screen.getByText("חלב – 2")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("קטגוריה"), {
    target: { value: "2" },
  });
  expect((screen.getByLabelText("מוצר") as HTMLSelectElement).value).toBe("");
  expect(screen.queryByRole("option", { name: "חלב" })).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "המשך להזמנה" }));
  expect(screen.getByText("חלב – 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "אשר הזמנה" }));
  expect(submitted).toBeUndefined();
  fireEvent.change(screen.getByLabelText("שם מלא"), {
    target: { value: "John Smith" },
  });
  expect(
    (screen.getByLabelText("שם מלא") as HTMLInputElement).value.trim(),
  ).toBe("");
  fireEvent.change(screen.getByLabelText("שם מלא"), {
    target: { value: "ישראל ישראלי" },
  });
  fireEvent.change(screen.getByLabelText("כתובת מלאה"), {
    target: { value: "הרצל 10 תל אביב" },
  });
  fireEvent.change(screen.getByLabelText("מייל"), {
    target: { value: "test@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "אשר הזמנה" }));
  await screen.findByRole("alert");
  expect((screen.getByLabelText("שם מלא") as HTMLInputElement).value).toBe(
    "ישראל ישראלי",
  );
  const requestId = submitted.requestId;
  expect(submitted.items[0].quantity).toBe(2);
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: "אשר הזמנה" }));
  await screen.findByText("ההזמנה נשמרה בהצלחה");
  expect(submitted.requestId).toBe(requestId);
});
it("shows a useful frontend 404 page", () => {
  window.history.replaceState(null, "", "/missing");
  render(
    <Provider store={createStore()}>
      <App />
    </Provider>,
  );
  expect(screen.getByText("העמוד לא נמצא")).toBeTruthy();
});
