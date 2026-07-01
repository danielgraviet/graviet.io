"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ALGOS = [
  {
    name: "Sliding Window",
    when: "Subarray/substring problems with a constraint (max sum, unique chars, at most k distinct)",
    hint: "Expand right, shrink left when constraint violated. O(n).",
  },
  {
    name: "Two Pointers",
    when: "Sorted array pair sums, removing duplicates, palindrome checks",
    hint: "Left + right converge, or slow + fast (Floyd's cycle). O(n).",
  },
  {
    name: "Binary Search",
    when: "Sorted input or monotonic condition. Find first/last, rotated array, search on answer space",
    hint: "lo=0, hi=n-1. Think about which half to eliminate. O(log n).",
  },
  {
    name: "BFS / Level Order",
    when: "Shortest path in unweighted graph, level-by-level tree, multi-source spread (islands, rotten oranges)",
    hint: "Queue + visited set. Process layer by layer. O(V+E).",
  },
  {
    name: "DFS / Backtracking",
    when: "Path existence, permutations/combinations, connected components, cycle detection",
    hint: "Recursive with visited or explicit stack. Backtrack = undo choice after recurse.",
  },
  {
    name: "Heap / Priority Queue",
    when: "Top-K elements, merge K sorted lists, streaming median, Dijkstra",
    hint: "Min-heap for smallest at top. heapq in Python. K largest → min-heap of size K.",
  },
  {
    name: "Hash Map / Set",
    when: "O(1) lookup, frequency count, two-sum, grouping anagrams, seen-before checks",
    hint: "Trade space for time. Think: what do I need to look up fast?",
  },
  {
    name: "Dynamic Programming",
    when: "Overlapping subproblems + optimal substructure. Knapsack, LCS, LIS, coin change",
    hint: "Define dp[i] clearly. Top-down (memo) or bottom-up (tabulation). Identify base cases first.",
  },
  {
    name: "Union-Find (DSU)",
    when: "Dynamic connectivity, grouping, number of components, Kruskal's MST",
    hint: "find() with path compression + union by rank = nearly O(1) amortized.",
  },
  {
    name: "Trie",
    when: "Prefix search, autocomplete, word dictionaries, IP routing tables",
    hint: "Each node = one char. children dict or array[26]. Mark end_of_word. Good for AI/infra prefix routing.",
  },
  {
    name: "Monotonic Stack",
    when: "Next greater/smaller element, largest rectangle in histogram, stock span",
    hint: "Maintain increasing or decreasing stack. Pop when invariant breaks.",
  },
  {
    name: "Topological Sort",
    when: "Dependency ordering, course schedule, build systems, DAG processing",
    hint: "Kahn's (BFS + in-degree) or DFS post-order. Cycle = no valid ordering.",
  },
];

const APPROACHES = [
  {
    label: "Time vs. Space",
    description: "Can you trade memory for speed? Memoize, cache, precompute, or use a hash map to drop from O(n²) to O(n).",
  },
  {
    label: "Simple vs. Production",
    description: "Brute force first — prove correctness. Then optimize. Mention what a prod solution would add: error handling, distributed considerations, scaling.",
  },
  {
    label: "Eager vs. Lazy",
    description: "Compute upfront or on-demand? Lazy evaluation can avoid work for sparse access patterns. Eager is simpler and often faster for dense use.",
  },
  {
    label: "Iterative vs. Recursive",
    description: "Recursion is elegant but risks stack overflow at scale. Iterative with explicit stack is safer for production. Mention both.",
  },
  {
    label: "Greedy vs. Optimal (DP)",
    description: "Greedy works when local optimal = global optimal. Otherwise you need DP or exhaustive search. Can you prove greedy is safe?",
  },
  {
    label: "Online vs. Offline",
    description: "Can you sort/preprocess the input? Offline (process all data at once) often enables better algos than online (streaming) constraints.",
  },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function InterviewTool() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [lastSummaryAt, setLastSummaryAt] = useState(0);
  const [showSummaryBanner, setShowSummaryBanner] = useState(false);
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  const [openAlgo, setOpenAlgo] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setElapsed((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  // Trigger summary reminder at 5-min intervals (300s)
  useEffect(() => {
    if (elapsed > 0 && elapsed % 300 === 0 && elapsed !== lastSummaryAt) {
      setLastSummaryAt(elapsed);
      setSummaryDismissed(false);
      setShowSummaryBanner(true);
    }
  }, [elapsed, lastSummaryAt]);

  // Auto-hide banner after 60 seconds if not dismissed
  useEffect(() => {
    if (!showSummaryBanner) return;
    const t = setTimeout(() => setShowSummaryBanner(false), 60000);
    return () => clearTimeout(t);
  }, [showSummaryBanner]);

  function handleStartStop() {
    setRunning((r) => !r);
  }

  function handleReset() {
    setRunning(false);
    setElapsed(0);
    setLastSummaryAt(0);
    setShowSummaryBanner(false);
    setSummaryDismissed(false);
  }

  function dismissBanner() {
    setSummaryDismissed(true);
    setShowSummaryBanner(false);
  }

  const nextSummaryIn = elapsed > 0 ? 300 - (elapsed % 300) : 300;
  const timerColor =
    elapsed > 0 && elapsed % 300 <= 60 && elapsed % 300 > 0
      ? "text-amber-600"
      : "text-foreground";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-display mb-2">Interview Tool</h1>
        <p className="text-text-secondary leading-relaxed">
          Timer, structure reminders, and algorithm reference for AI/infra interviews.
        </p>
      </div>

      {/* Summary Banner */}
      {showSummaryBanner && !summaryDismissed && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <div>
            <p className="font-semibold text-amber-800 text-sm">Time to summarize</p>
            <p className="text-amber-700 text-sm mt-0.5">
              It&apos;s been {Math.floor(elapsed / 60)} minutes. Quickly recap what you&apos;ve done, your current approach, and any tradeoffs you&apos;ve considered.
            </p>
          </div>
          <button
            onClick={dismissBanner}
            className="shrink-0 text-amber-500 hover:text-amber-700 text-lg leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Timer */}
      <section className="mb-10">
        <p className="mb-3 text-sm font-semibold text-text-secondary">Timer</p>
        <div className="border-t border-border pt-5">
          <div className={`text-6xl font-mono font-semibold tabular-nums mb-5 transition-colors ${timerColor}`}>
            {formatTime(elapsed)}
          </div>
          <div className="flex gap-3 flex-wrap mb-4">
            <button
              onClick={handleStartStop}
              className="px-5 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors text-text-secondary"
            >
              Reset
            </button>
          </div>
          {running && (
            <p className="text-xs text-text-secondary">
              Next summary prompt in{" "}
              <span className="font-medium text-foreground">
                {Math.floor(nextSummaryIn / 60)}m {nextSummaryIn % 60}s
              </span>
            </p>
          )}
          {!running && elapsed === 0 && (
            <p className="text-xs text-text-secondary">
              You&apos;ll be reminded to summarize every 5 minutes.
            </p>
          )}
        </div>
      </section>

      {/* Approach Framework */}
      <section className="mb-10">
        <p className="mb-3 text-sm font-semibold text-text-secondary">Approach Framework</p>
        <p className="text-xs text-text-secondary mb-4">
          Before coding, consider 2–3 of these axes. State your tradeoffs out loud.
        </p>
        <div className="border-t border-border">
          {APPROACHES.map((a) => (
            <div
              key={a.label}
              className="border-b border-border py-4"
            >
              <p className="font-semibold text-sm mb-1">{a.label}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Summary Checklist */}
      <section className="mb-10">
        <p className="mb-3 text-sm font-semibold text-text-secondary">Summarize Checklist</p>
        <p className="text-xs text-text-secondary mb-4">
          Every 5–7 minutes, quickly hit these points aloud.
        </p>
        <div className="border-t border-border">
          {[
            "What problem am I solving? (restate briefly)",
            "What approach am I taking and why?",
            "What's the time/space complexity?",
            "What edge cases have I considered?",
            "What would I do differently in production?",
            "What's left to implement or test?",
          ].map((item, i) => (
            <div
              key={i}
              className="flex gap-3 items-start border-b border-border py-3"
            >
              <span className="mt-0.5 text-xs text-text-secondary font-mono shrink-0">{i + 1}.</span>
              <p className="text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Algorithm Reference */}
      <section>
        <p className="mb-3 text-sm font-semibold text-text-secondary">Algorithm Reference</p>
        <p className="text-xs text-text-secondary mb-4">
          Click any pattern to see when to use it and the key implementation note.
        </p>
        <div className="border-t border-border">
          {ALGOS.map((algo) => {
            const isOpen = openAlgo === algo.name;
            return (
              <div key={algo.name} className="border-b border-border">
                <button
                  onClick={() => setOpenAlgo(isOpen ? null : algo.name)}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="font-semibold text-sm">{algo.name}</span>
                  <span className="text-text-secondary text-lg leading-none group-hover:text-foreground transition-colors">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-4 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">When</p>
                      <p className="text-sm leading-relaxed">{algo.when}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Key Insight</p>
                      <p className="text-sm leading-relaxed text-text-secondary">{algo.hint}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
