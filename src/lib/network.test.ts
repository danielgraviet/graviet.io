import { describe, expect, it } from "vitest";
import { shortestPath, type NetworkGraph } from "./network";

const graph: NetworkGraph = {
  rootId: 1,
  people: [1, 2, 3, 4].map((id) => ({ id, name: String(id), aliases: [], description: "", occupation: "", notable: false, profileUrl: null, createdAt: "", updatedAt: "" })),
  relationships: [
    { id: 1, sourceId: 1, targetId: 2, sourceName: "1", targetName: "2", type: "met", notes: "", occurredOn: null, status: "confirmed", edgeKind: "personal", confidence: 100, evidence: [] },
    { id: 2, sourceId: 2, targetId: 3, sourceName: "2", targetName: "3", type: "worked_with", notes: "", occurredOn: null, status: "confirmed", edgeKind: "public", confidence: 80, evidence: [] },
    { id: 3, sourceId: 1, targetId: 4, sourceName: "1", targetName: "4", type: "draft", notes: "", occurredOn: null, status: "draft", edgeKind: "potential", confidence: 50, evidence: [] },
  ],
};

describe("shortestPath", () => {
  it("finds confirmed undirected paths", () => expect(shortestPath(graph, 3)).toEqual([1, 2, 3]));
  it("excludes draft relationships", () => expect(shortestPath(graph, 4)).toBeNull());
  it("returns the root for a self-query", () => expect(shortestPath(graph, 1)).toEqual([1]));
});
