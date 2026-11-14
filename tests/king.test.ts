import { it, expect } from "vitest";
import { targetsFrom } from "@/lib/chess";
it("king avoids attacked squares", () => {
  expect(targetsFrom("4r3/8/8/8/3K4/8/8/8 w - - 0 1", "d4")).toEqual(["c3", "c4", "c5", "d3", "d5"]);
  expect(targetsFrom("8/8/8/8/8/1b6/8/4K3 w - - 0 1", "e1")).toEqual(["d2", "e2", "f1", "f2"]);
});
