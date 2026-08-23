"use client";

import { useEffect, useRef, useState } from "react";
import { createUISFX, type UISFXPlayer } from "uisfx";

const preferenceKey = "graviet:sound-preferences";

export default function UISFX() {
  const playerRef = useRef<UISFXPlayer | null>(null);
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "{}");
      return typeof saved.enabled === "boolean" ? saved.enabled : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const soundPlayer = createUISFX({
      pack: "zen",
      volume: 0.42,
      preferences: { key: preferenceKey },
    });

    playerRef.current = soundPlayer;
    if (process.env.NODE_ENV !== "production") {
      console.log("[UISFX] initialized", {
        enabled: soundPlayer.isEnabled(),
        pack: soundPlayer.getPack(),
        volume: soundPlayer.getVolume(),
      });
    }

    const play = (cue: "press" | "select") => {
      void soundPlayer.unlock();
      const playback = soundPlayer.play(cue);
      if (process.env.NODE_ENV !== "production") {
        console.log("[UISFX] play", { cue, enabled: soundPlayer.isEnabled(), playback: Boolean(playback) });
      }
    };

    let lastButtonSoundAt = 0;
    const findButton = (event: Event) => {
      const target = event.target;
      return target instanceof Element ? target.closest("button, a[href]") : null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const button = findButton(event);
      if (!button || (button instanceof HTMLButtonElement && button.disabled) || button.closest("[data-sound-toggle]")) return;
      lastButtonSoundAt = performance.now();
      if (process.env.NODE_ENV !== "production") console.log("[UISFX] pointer interactive", button);
      play(button instanceof HTMLAnchorElement ? "select" : "press");
    };

    const handleClick = (event: MouseEvent) => {
      const button = findButton(event);
      if (!button || (button instanceof HTMLButtonElement && button.disabled) || button.closest("[data-sound-toggle]")) return;
      if (performance.now() - lastButtonSoundAt < 300) return;
      if (process.env.NODE_ENV !== "production") console.log("[UISFX] click interactive", button);
      play(button instanceof HTMLAnchorElement ? "select" : "press");
    };

    const handleChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
      if (target instanceof HTMLInputElement && target.type !== "checkbox" && target.type !== "radio") return;
      play("select");
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleChange);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", handleChange);
      playerRef.current = null;
      void soundPlayer.destroy();
    };
  }, []);

  function toggleSound() {
    const soundPlayer = playerRef.current;
    if (!soundPlayer) return;
    const nextEnabled = !soundPlayer.isEnabled();
    soundPlayer.setEnabled(nextEnabled);
    setEnabled(nextEnabled);
    if (nextEnabled) {
      void soundPlayer.unlock();
      soundPlayer.play("select");
    }
  }

  function previewSound() {
    const soundPlayer = playerRef.current;
    if (!soundPlayer?.isEnabled()) return;
    void soundPlayer.unlock();
    soundPlayer.play("select");
  }

  return (
    <button
      type="button"
      data-sound-toggle
      onPointerDown={previewSound}
      onClick={toggleSound}
      className="mt-3 text-xs text-text-secondary underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
      aria-pressed={enabled}
      aria-label={`${enabled ? "Mute" : "Enable"} interface sounds`}
    >
      Sounds: {enabled ? "on" : "off"}
    </button>
  );
}
