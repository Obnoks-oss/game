/* @vitest-environment jsdom */
import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadRecord, saveRecord } from "../src/storage.js";

describe("storage module", () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
  });

  test("loadRecord returns 0 when no saved record exists", () => {
    global.localStorage.getItem.mockReturnValue(null);
    expect(loadRecord()).toBe(0);
    expect(global.localStorage.getItem).toHaveBeenCalledWith("reaction_hunter_record");
  });

  test("loadRecord returns parsed record when record exists", () => {
    global.localStorage.getItem.mockReturnValue("24");
    expect(loadRecord()).toBe(24);
  });

  test("saveRecord writes the record to localStorage", () => {
    saveRecord(18);
    expect(global.localStorage.setItem).toHaveBeenCalledWith("reaction_hunter_record", "18");
  });
});