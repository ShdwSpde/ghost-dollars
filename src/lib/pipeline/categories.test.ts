import { describe, it, expect } from "vitest";
import { bucketForAgency, AGENCY_BUCKET } from "./categories";

describe("bucketForAgency", () => {
  it("maps neighborhood agencies correctly", () => {
    expect(bucketForAgency("DOE")).toBe("neighborhood");
    expect(bucketForAgency("DPR")).toBe("neighborhood");
    expect(bucketForAgency("HPD")).toBe("neighborhood");
    expect(bucketForAgency("NYPL")).toBe("neighborhood");
    expect(bucketForAgency("BPL")).toBe("neighborhood");
    expect(bucketForAgency("QPL")).toBe("neighborhood");
  });

  it("maps citywide agencies correctly", () => {
    expect(bucketForAgency("DEP")).toBe("citywide");
    expect(bucketForAgency("DDC")).toBe("citywide");
    expect(bucketForAgency("DOT")).toBe("citywide");
    expect(bucketForAgency("EDC")).toBe("citywide");
    expect(bucketForAgency("CUNY")).toBe("citywide");
    expect(bucketForAgency("OTI")).toBe("citywide");
  });

  it("returns 'other' for unknown agencies", () => {
    expect(bucketForAgency("UNKNOWN")).toBe("other");
    expect(bucketForAgency("XYZ")).toBe("other");
    expect(bucketForAgency("")).toBe("other");
  });

  it("normalizes to uppercase before lookup", () => {
    expect(bucketForAgency("doe")).toBe("neighborhood");
    expect(bucketForAgency("Dep")).toBe("citywide");
    expect(bucketForAgency("  HPD  ")).toBe("neighborhood");
  });

  it("covers all 25 agencies actually present in the dataset", () => {
    const actualAgencies = [
      "ACS","BPL","CUNY","DCAS","DCLA","DDC","DEP","DFTA","DHS",
      "DOC","DOE","DOHMH","DOT","DPR","DSNY","EDC","FDNY","HHC",
      "HPD","HRA","NYPD","NYPL","NYRL","OTI","QPL",
    ];
    for (const ag of actualAgencies) {
      const result = bucketForAgency(ag);
      expect(["neighborhood","citywide","other"]).toContain(result);
      // every known agency should have a defined bucket (not "other")
      expect(result).not.toBe("other");
    }
  });

  it("all entries in AGENCY_BUCKET are 'neighborhood' or 'citywide'", () => {
    for (const [, val] of Object.entries(AGENCY_BUCKET)) {
      expect(["neighborhood","citywide"]).toContain(val);
    }
  });
});
