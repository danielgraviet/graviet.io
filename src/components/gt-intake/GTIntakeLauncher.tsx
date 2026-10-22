"use client";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import GTIntakeChat from "./GTIntakeChat";

const openEvent = "gt-intake:open";
let launcherReady = false;
let pendingOpen = false;

export function openGTIntake(entry = "cta") {
  if (!launcherReady) {
    pendingOpen = true;
    return;
  }
  window.dispatchEvent(new CustomEvent(openEvent, { detail: { entry } }));
}

export default function GTIntakeLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(0);

  const open = useCallback(() => {
    flushSync(() => {
      setSession((current) => current + 1);
      setIsOpen(true);
    });
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleOpen = () => open();
    window.addEventListener(openEvent, handleOpen);
    launcherReady = true;
    let pendingTimer: number | null = null;
    if (pendingOpen) {
      pendingOpen = false;
      pendingTimer = window.setTimeout(() => {
        setSession((current) => current + 1);
        setIsOpen(true);
      }, 0);
    }
    return () => {
      if (pendingTimer !== null) window.clearTimeout(pendingTimer);
      launcherReady = false;
      window.removeEventListener(openEvent, handleOpen);
    };
  }, [open]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-5 md:p-6">
      <div
        className="grid h-[min(820px,calc(100dvh-24px))] w-[min(680px,calc(100vw-24px))] min-h-0 grid-rows-[minmax(130px,0.32fr)_minmax(0,1fr)] gap-2 overflow-hidden rounded-[26px] bg-[#090b0e] p-2 shadow-[0_32px_100px_-30px_rgba(0,0,0,0.8)] md:h-[min(760px,calc(100dvh-48px))] md:w-[min(1160px,calc(100vw-48px))] md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:grid-rows-1 md:gap-4 md:rounded-[30px] md:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Start a conversation with Graviet Technologies"
      >
        <aside className="relative min-h-0 overflow-hidden rounded-2xl bg-[#090b0e]">
          <Image
            src="/gt-intake-visual.svg"
            alt="Abstract illustration of a website and lead conversation working together"
            fill
            priority
            sizes="(min-width: 768px) 44vw, 95vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/15" />
          <div className="absolute bottom-4 left-5 right-5 text-white sm:bottom-6 sm:left-7 sm:right-7 md:bottom-10 md:left-8 md:right-8 lg:bottom-14 lg:left-12 lg:right-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 md:text-xs">
              Graviet Technologies
            </p>
            <h2 className="mt-2 max-w-xl text-xl font-semibold leading-[1.02] tracking-[-0.065em] sm:text-2xl md:mt-3 md:text-4xl lg:text-5xl">
              Growth systems for the next stage of your business.
            </h2>
            <p className="mt-2 hidden max-w-lg text-sm leading-6 text-white/70 sm:block md:mt-4">
              Tell us what you want to improve. We’ll help you find the right
              next step.
            </p>
          </div>
        </aside>
        <GTIntakeChat key={session} fullScreen onClose={close} />
      </div>
    </div>
  );
}
