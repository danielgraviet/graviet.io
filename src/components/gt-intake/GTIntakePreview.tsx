"use client";

import { ArrowUpRight } from "lucide-react";
import { openGTIntake } from "./GTIntakeLauncher";

export default function GTIntakePreview() {
  return (
    <button
      type="button"
      onClick={() => openGTIntake("hero_preview")}
      aria-label="Open the GT intake conversation"
      className="flex h-[min(560px,calc(100svh-190px))] min-h-[460px] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white text-left text-[#222] shadow-[0_28px_70px_-28px_rgba(0,0,0,0.55),0_14px_34px_-22px_rgba(0,82,155,0.65)] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#79b9ef]"
    >
      <span className="flex items-center gap-3 border-b border-[#171717]/10 px-5 py-3">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00529b] font-semibold tracking-[-0.08em] text-white">
          GT
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#36a269]" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold">GT Intake</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00529b]">
          Start <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      </span>
      <span className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-[#f7f8fa] px-5 py-5">
        <span className="flex items-end gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00529b] text-[9px] font-bold tracking-[-0.06em] text-white">
            GT
          </span>
          <span className="max-w-[85%] rounded-2xl rounded-bl-md border border-black/[0.06] bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#30353a] shadow-sm">
            Hi, I’m GT’s intake assistant.
          </span>
        </span>
        <span className="flex items-end gap-2">
          <span className="h-7 w-7 shrink-0" aria-hidden="true" />
          <span className="max-w-[85%] rounded-2xl rounded-bl-md border border-black/[0.06] bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#30353a] shadow-sm">
            What kind of business do you run?
          </span>
        </span>
        <span className="ml-9 flex flex-wrap gap-2">
          {["Law firm", "Local services", "Healthcare", "Other"].map(
            (option) => (
              <span
                key={option}
                className="rounded-full border border-[#00529b]/25 bg-white px-3 py-2 text-xs font-medium text-[#163d64]"
              >
                {option}
              </span>
            ),
          )}
        </span>
        <span className="mt-auto flex items-center gap-2 border-t border-[#171717]/[0.08] pt-4 text-xs text-[#727a82]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00529b] text-[8px] font-bold text-white">
            GT
          </span>
          Open the conversation to get started
        </span>
      </span>
      <span
        className="flex h-[5px] items-center gap-[3px] bg-[#00529b] px-4"
        aria-hidden="true"
      >
        <span className="h-full w-[3px] bg-white" />
        <span className="h-full w-[3px] bg-white" />
        <span className="ml-auto h-[3px] w-8 bg-white/80" />
      </span>
    </button>
  );
}
