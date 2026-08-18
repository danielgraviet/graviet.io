const tagColors: Record<string, string> = {
  Daytona: "bg-emerald-100 text-emerald-800",
  AI: "bg-violet-100 text-violet-800",
  "AI Agents": "bg-violet-100 text-violet-800",
  RL: "bg-amber-100 text-amber-800",
  RLVR: "bg-amber-100 text-amber-800",
  "Reinforcement Learning": "bg-amber-100 text-amber-800",
  GRPO: "bg-orange-100 text-orange-800",
  PPO: "bg-orange-100 text-orange-800",
  MachineLearning: "bg-sky-100 text-sky-800",
  GPU: "bg-pink-100 text-pink-800",
  Infrastructure: "bg-blue-100 text-blue-800",
  Kubernetes: "bg-blue-100 text-blue-800",
  Sandboxes: "bg-teal-100 text-teal-800",
  Snapshots: "bg-teal-100 text-teal-800",
  "Coding Agents": "bg-indigo-100 text-indigo-800",
  Systems: "bg-slate-200 text-slate-800",
  "CPU Architecture": "bg-slate-200 text-slate-800",
  Forecasting: "bg-fuchsia-100 text-fuchsia-800",
  Culture: "bg-rose-100 text-rose-800",
  History: "bg-yellow-100 text-yellow-800",
  Music: "bg-red-100 text-red-800",
  Personal: "bg-stone-200 text-stone-800",
  Writing: "bg-stone-200 text-stone-800",
};

export default function PostTag({ tag }: { tag: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        tagColors[tag] ?? "bg-muted text-text-secondary"
      }`}
    >
      {tag}
    </span>
  );
}
