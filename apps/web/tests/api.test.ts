import { afterEach, it, expect, vi } from "vitest";
import { requestJson, ApiError, errorMessage } from "../src/api";
afterEach(() => vi.unstubAllGlobals());
it.each([400, 404, 429, 500, 503])(
  "handles HTTP %s without exposing server details",
  async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(requestJson("/test")).rejects.toBeInstanceOf(ApiError);
    expect(errorMessage(new ApiError(status))).not.toContain("HTTP");
  },
);
it("returns a useful network failure message", () =>
  expect(errorMessage(new TypeError("secret stack"))).not.toContain("secret"));
