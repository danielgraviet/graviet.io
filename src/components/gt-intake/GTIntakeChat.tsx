"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { gtIntakeFlow } from "@/lib/gt-intake/flow";
import { StepInput } from "./step-input";
import { useIntakeConversation } from "./use-intake-conversation";

type SubmitState = "idle" | "sending" | "sent" | "error";

export default function GTIntakeChat({
  fullScreen = false,
  onClose,
}: {
  fullScreen?: boolean;
  onClose?: () => void;
} = {}) {
  return <GTIntakeChatSession fullScreen={fullScreen} onClose={onClose} />;
}

function GTIntakeChatSession({
  fullScreen,
  onClose,
}: {
  fullScreen: boolean;
  onClose?: () => void;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [websiteCheck, setWebsiteCheck] = useState("");
  const { messages, answers, isTyping, isComplete, currentStep, answer } =
    useIntakeConversation(gtIntakeFlow);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, currentStep, submitState]);

  const submitRequest = useCallback(async () => {
    if (submitState === "sending" || submitState === "sent") return;
    setSubmitState("sending");
    try {
      const response = await fetch("/api/gt-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          transcript: messages,
          websiteCheck,
        }),
      });
      if (!response.ok) throw new Error("Unable to submit the request.");
      setSubmitState("sent");
    } catch {
      setSubmitState("error");
    }
  }, [answers, messages, submitState, websiteCheck]);

  useEffect(() => {
    if (!isComplete || submitState !== "idle") return;
    const timer = window.setTimeout(() => void submitRequest(), 0);
    return () => window.clearTimeout(timer);
  }, [isComplete, submitRequest, submitState]);

  return (
    <section
      aria-label="GT live intake assistant"
      className={
        fullScreen
          ? "flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden rounded-2xl bg-white text-[#222] shadow-[0_28px_70px_-28px_rgba(0,0,0,0.55),0_14px_34px_-22px_rgba(0,82,155,0.65)]"
          : "flex h-[min(560px,calc(100svh-190px))] min-h-[460px] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white text-[#222] shadow-[0_28px_70px_-28px_rgba(0,0,0,0.55),0_14px_34px_-22px_rgba(0,82,155,0.65)]"
      }
    >
      <label
        className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        Leave this field empty
        <input
          name="websiteCheck"
          tabIndex={-1}
          autoComplete="off"
          value={websiteCheck}
          onChange={(event) => setWebsiteCheck(event.target.value)}
        />
      </label>
      <header className="flex items-center gap-3 border-b border-[#171717]/10 bg-white px-5 py-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00529b] font-semibold tracking-[-0.08em] text-white">
          GT
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#36a269]" />
        </div>
        <p className="min-w-0 flex-1 text-sm font-semibold">GT Intake</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f1f2] text-[#252525] transition-colors hover:bg-[#e2e4e6]"
            aria-label="Close intake"
          >
            <X size={19} />
          </button>
        )}
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col bg-[#f7f8fa]"
        aria-busy={submitState === "sending"}
      >
        <div
          ref={transcriptRef}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.map((message, index) =>
            message.role === "bot" ? (
              <div key={index} className="flex items-end gap-2">
                {messages[index - 1]?.role !== "bot" ? (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00529b] text-[9px] font-bold tracking-[-0.06em] text-white">
                    GT
                  </span>
                ) : (
                  <span className="h-7 w-7 shrink-0" aria-hidden="true" />
                )}
                <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-black/[0.06] bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#30353a] shadow-sm">
                  {message.text}
                </p>
              </div>
            ) : (
              <p
                key={index}
                className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-[#00529b] px-3.5 py-2.5 text-[13px] leading-5 text-white"
              >
                {message.text}
              </p>
            ),
          )}

          {submitState === "sent" && (
            <div className="flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00529b] text-[9px] font-bold tracking-[-0.06em] text-white">
                GT
              </span>
              <p
                className="max-w-[85%] rounded-2xl rounded-bl-md border border-black/[0.06] bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#30353a] shadow-sm"
                role="status"
              >
                Thanks, {answers.firstName}. Your request has been sent to GT.
              </p>
            </div>
          )}

          {(isTyping || submitState === "sending") && (
            <div className="flex items-end gap-2" aria-label="GT is typing">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00529b] text-[9px] font-bold tracking-[-0.06em] text-white">
                GT
              </span>
              <p className="flex h-10 items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7b8793]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7b8793] [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7b8793] [animation-delay:300ms]" />
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[#171717]/[0.08] bg-white px-4 py-4">
          {currentStep && submitState !== "sent" && (
            <StepInput step={currentStep} onAnswer={answer} />
          )}

          {submitState === "sending" && (
            <p className="text-xs text-[#59636e]" role="status">
              Sending your request to GT…
            </p>
          )}
          {submitState === "error" && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-red-700" role="alert">
                We couldn’t send that just now. Your answers are still here.
              </p>
              <button
                type="button"
                onClick={() => void submitRequest()}
                className="shrink-0 text-xs font-semibold text-[#00529b] underline underline-offset-4"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex h-[5px] items-center gap-[3px] bg-[#00529b] px-4"
        aria-hidden="true"
      >
        <span className="h-full w-[3px] bg-white" />
        <span className="h-full w-[3px] bg-white" />
        <span className="ml-auto h-[3px] w-8 bg-white/80" />
      </div>
    </section>
  );
}
