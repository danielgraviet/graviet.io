"use client";

import type { ReactNode } from "react";
import { openGTIntake } from "./GTIntakeLauncher";

export function GTIntakeTrigger({
  children,
  className,
  entry,
}: {
  children: ReactNode;
  className?: string;
  entry: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => openGTIntake(entry)}
      data-event="gt_intake_open"
      data-event-location={entry}
    >
      {children}
    </button>
  );
}
