import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Caveat } from "./Caveat";

describe("Caveat", () => {
  it("renders the message", () => {
    render(<Caveat message="half the money is invisible" locked />);
    expect(screen.getByText(/invisible/)).toBeTruthy();
  });
  it("hides the dismiss control when locked", () => {
    render(<Caveat message="locked note" locked />);
    expect(screen.queryByRole("button", { name: /dismiss/i })).toBeNull();
  });
});
