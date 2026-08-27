import { describe, expect, it } from "vitest";
import { compareOrbitPeople, isOrbitDate, normalizeOrbitName, type OrbitPerson } from "./orbit";

function person(name: string, status: OrbitPerson["status"], lastContactedOn: string | null): OrbitPerson {
  return { id: 1, name, status, lastContactedOn, latestContactNote: "", contactCount: 0, createdAt: "", updatedAt: "" };
}

describe("Orbit helpers", () => {
  it("normalizes names for duplicate detection", () => {
    expect(normalizeOrbitName("  Sam   Bridge ")).toBe("sam bridge");
  });

  it("sorts by attention, missing date, oldest date, then name", () => {
    const people = [
      person("Green", "green", null),
      person("Orange", "orange", null),
      person("Later", "red", "2026-08-20"),
      person("Never", "red", null),
      person("Earlier", "red", "2026-07-01"),
    ];
    expect(people.sort(compareOrbitPeople).map((entry) => entry.name)).toEqual([
      "Never", "Earlier", "Later", "Orange", "Green",
    ]);
  });

  it("accepts only real ISO calendar dates", () => {
    expect(isOrbitDate("2026-08-27")).toBe(true);
    expect(isOrbitDate("2026-02-30")).toBe(false);
    expect(isOrbitDate("08/27/2026")).toBe(false);
  });
});
