"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  resolvePrompt,
  type IntakeAnswers,
  type IntakeFlow,
} from "@/lib/gt-intake/flow";
import type { StepAnswer } from "./step-input";

export type IntakeMessage = {
  role: "bot" | "user";
  text: string;
};

function typingDelay(text: string) {
  return Math.min(1400, Math.max(450, 300 + text.length * 12));
}

/** Conversation pacing and step progression adapted from Gunter's intake flow. */
export function useIntakeConversation(flow: IntakeFlow) {
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const say = useCallback((lines: string[], initialPause = 250) => {
    if (lines.length === 0) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    let elapsed = initialPause;
    lines.forEach((line, index) => {
      elapsed += typingDelay(line);
      const id = window.setTimeout(() => {
        setMessages((current) => [...current, { role: "bot", text: line }]);
        if (index === lines.length - 1) setIsTyping(false);
      }, elapsed);
      timers.current.push(id);
      elapsed += 220;
    });
  }, []);

  useEffect(() => {
    const startId = window.setTimeout(
      () => say(resolvePrompt(flow.steps[0].prompt, {}), 250),
      0,
    );
    return () => {
      window.clearTimeout(startId);
      clearTimers();
    };
  }, [clearTimers, flow, say]);

  const answer = useCallback(
    ({ display, values }: StepAnswer) => {
      const nextAnswers = { ...answers, ...values };
      const nextIndex = stepIndex + 1;
      setMessages((current) => [...current, { role: "user", text: display }]);
      setAnswers(nextAnswers);
      setStepIndex(nextIndex);

      const completed = nextIndex >= flow.steps.length;
      const nextLines = resolvePrompt(
        completed ? flow.closing : flow.steps[nextIndex].prompt,
        nextAnswers,
      );
      say(nextLines);
    },
    [answers, flow, say, stepIndex],
  );

  const isComplete = stepIndex >= flow.steps.length;
  const currentStep = !isTyping && !isComplete ? flow.steps[stepIndex] : null;

  return { messages, answers, isTyping, isComplete, currentStep, answer };
}
