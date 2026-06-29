import { describe, it, expect } from "vitest";
import { neighborhoodImage } from "./neighborhoodImages";

describe("neighborhoodImage", () => {
  it("returns an image for a known boroCd", () => {
    const img = neighborhoodImage("403");
    expect(img).not.toBeNull();
    expect(img!.src).toMatch(/^\/images\//);
    expect(img!.alt).toBeTruthy();
    expect(img!.credit).toBeTruthy();
    expect(img!.license).toBeTruthy();
    expect(img!.sourceUrl).toMatch(/^https:\/\//);
  });

  it("returns null for an unknown boroCd", () => {
    expect(neighborhoodImage("999")).toBeNull();
  });

  it("covers all 13 expected neighborhoods", () => {
    const expected = ["403","404","407","410","412","112","110","103","201","205","303","308","316"];
    for (const cd of expected) {
      const img = neighborhoodImage(cd);
      expect(img, `boroCd ${cd} should have an image`).not.toBeNull();
      expect(img!.src).toBe(`/images/neighborhoods/${cd}.jpg`);
    }
  });
});
