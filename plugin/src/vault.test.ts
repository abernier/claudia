/**
 * The vault seam's resolver (ADR-0035). One question, answered in one place:
 * where does the person's Memory live? Everything here pins the two-step
 * contract — the root override wins, the home directory is the fallback —
 * because nine call sites used to answer it independently and only one of
 * them honoured the override.
 */
import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";

import { resolveVaultRoot } from "./vault.mjs";

describe("resolveVaultRoot", () => {
  it("falls back to .claudia under the given home", () => {
    expect(resolveVaultRoot({}, "/home/sixtine")).toBe(path.join("/home/sixtine", ".claudia"));
  });

  it("lets the root override win over the home directory", () => {
    const env = { CLAUDIA_ROOT: "/somewhere/else/vault" };
    expect(resolveVaultRoot(env, "/home/sixtine")).toBe("/somewhere/else/vault");
  });

  it("treats an empty override as absent", () => {
    // `CLAUDIA_ROOT=""` in a shell is a way of saying "unset" — resolving to ""
    // would aim every write at the current directory.
    expect(resolveVaultRoot({ CLAUDIA_ROOT: "" }, "/home/sixtine")).toBe(path.join("/home/sixtine", ".claudia"));
  });

  it("reads the real environment and home by default", () => {
    // No fabricated inputs: the zero-argument call is what every CLI adapter
    // runs, so its two halves must agree with the injectable form.
    const expected = process.env.CLAUDIA_ROOT || path.join(os.homedir(), ".claudia");
    expect(resolveVaultRoot()).toBe(expected);
  });
});
