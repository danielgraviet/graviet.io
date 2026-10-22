"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { SendHorizontal } from "lucide-react";
import type { IntakeStep } from "@/lib/gt-intake/flow";

export type StepAnswer = {
  display: string;
  values: Record<string, string>;
};

export function StepInput({
  step,
  onAnswer,
}: {
  step: IntakeStep;
  onAnswer: (answer: StepAnswer) => void;
}) {
  if (step.kind === "choice") {
    return (
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Choose an option"
      >
        {step.options.map((option) => (
          <button
            key={option}
            type="button"
            className="rounded-full border border-[#00529b]/25 bg-white px-3 py-2 text-left text-xs font-medium text-[#163d64] transition-colors hover:border-[#00529b] hover:bg-[#eef5fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00529b]"
            onClick={() =>
              onAnswer({ display: option, values: { [step.id]: option } })
            }
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (step.kind === "text") {
    return <TextInput step={step} onAnswer={onAnswer} />;
  }

  if (step.kind === "name") {
    return <NameInput onAnswer={onAnswer} />;
  }

  if (step.kind === "phone") {
    return <PhoneInput onAnswer={onAnswer} />;
  }

  return <EmailInput onAnswer={onAnswer} />;
}

function StepForm({
  onSubmit,
  children,
}: {
  onSubmit: () => void;
  children: ReactNode;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2" noValidate>
      {children}
    </form>
  );
}

function SubmitButton({
  disabled,
  label = "Send message",
}: {
  disabled: boolean;
  label?: string;
}) {
  return (
    <button
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00529b] text-white transition-colors hover:bg-[#003b70] disabled:cursor-not-allowed disabled:opacity-40"
      type="submit"
      disabled={disabled}
      aria-label={label}
    >
      <SendHorizontal aria-hidden="true" size={19} strokeWidth={2.5} />
    </button>
  );
}

function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}

function TextInput({
  step,
  onAnswer,
}: {
  step: Extract<IntakeStep, { kind: "text" }>;
  onAnswer: (answer: StepAnswer) => void;
}) {
  const [value, setValue] = useState("");
  const ref = useAutoFocus<HTMLTextAreaElement>();
  const trimmed = value.trim();
  const valid = trimmed.length >= 2;

  function submit() {
    if (valid) onAnswer({ display: trimmed, values: { [step.id]: trimmed } });
  }

  return (
    <StepForm onSubmit={submit}>
      <label className="sr-only" htmlFor={`gt-intake-${step.id}`}>
        {step.label}
      </label>
      <textarea
        ref={ref}
        id={`gt-intake-${step.id}`}
        className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-[#d6dbe0] bg-white px-3 py-2.5 text-sm text-[#252525] outline-none placeholder:text-[#81868c] focus:border-[#00529b]"
        rows={1}
        maxLength={1200}
        value={value}
        placeholder={step.placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <SubmitButton disabled={!valid} />
    </StepForm>
  );
}

function NameInput({ onAnswer }: { onAnswer: (answer: StepAnswer) => void }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const ref = useAutoFocus<HTMLInputElement>();
  const firstName = first.trim();
  const lastName = last.trim();
  const valid = firstName.length > 0 && lastName.length > 0;

  return (
    <StepForm
      onSubmit={() => {
        if (valid) {
          onAnswer({
            display: `${firstName} ${lastName}`,
            values: { firstName, lastName },
          });
        }
      }}
    >
      <input
        ref={ref}
        className="min-w-0 flex-1 rounded-xl border border-[#d6dbe0] bg-white px-3 py-2.5 text-sm text-[#252525] outline-none placeholder:text-[#81868c] focus:border-[#00529b]"
        value={first}
        onChange={(event) => setFirst(event.target.value)}
        placeholder="First name"
        aria-label="First name"
        autoComplete="given-name"
        maxLength={100}
      />
      <input
        className="min-w-0 flex-1 rounded-xl border border-[#d6dbe0] bg-white px-3 py-2.5 text-sm text-[#252525] outline-none placeholder:text-[#81868c] focus:border-[#00529b]"
        value={last}
        onChange={(event) => setLast(event.target.value)}
        placeholder="Last name"
        aria-label="Last name"
        autoComplete="family-name"
        maxLength={100}
      />
      <SubmitButton disabled={!valid} label="Continue" />
    </StepForm>
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function PhoneInput({ onAnswer }: { onAnswer: (answer: StepAnswer) => void }) {
  const [value, setValue] = useState("");
  const ref = useAutoFocus<HTMLInputElement>();
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");
  const valid = digits.length >= 7 && digits.length <= 15;

  return (
    <StepForm
      onSubmit={() => {
        if (valid) onAnswer({ display: phone, values: { phone } });
      }}
    >
      <input
        ref={ref}
        className="min-w-0 flex-1 rounded-xl border border-[#d6dbe0] bg-white px-3 py-2.5 text-sm text-[#252525] outline-none placeholder:text-[#81868c] focus:border-[#00529b]"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={40}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Phone number"
        aria-label="Phone number"
      />
      <SubmitButton disabled={!valid} label="Continue" />
    </StepForm>
  );
}

function EmailInput({ onAnswer }: { onAnswer: (answer: StepAnswer) => void }) {
  const [value, setValue] = useState("");
  const ref = useAutoFocus<HTMLInputElement>();
  const email = value.trim();
  const valid = emailPattern.test(email);

  return (
    <StepForm
      onSubmit={() => {
        if (valid) onAnswer({ display: email, values: { email } });
      }}
    >
      <input
        ref={ref}
        className="min-w-0 flex-1 rounded-xl border border-[#d6dbe0] bg-white px-3 py-2.5 text-sm text-[#252525] outline-none placeholder:text-[#81868c] focus:border-[#00529b]"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={200}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
      />
      <SubmitButton disabled={!valid} label="Continue" />
    </StepForm>
  );
}
