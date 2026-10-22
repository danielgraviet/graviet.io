export type IntakeAnswers = Record<string, string>;

export type IntakePrompt =
  | string
  | string[]
  | ((answers: IntakeAnswers) => string | string[]);

type BaseStep = {
  id: string;
  prompt: IntakePrompt;
};

export type ChoiceStep = BaseStep & {
  kind: "choice";
  options: string[];
};

export type TextStep = BaseStep & {
  kind: "text";
  label: string;
  placeholder: string;
};

export type NameStep = BaseStep & { kind: "name" };
export type PhoneStep = BaseStep & { kind: "phone" };
export type EmailStep = BaseStep & { kind: "email" };

export type IntakeStep =
  | ChoiceStep
  | TextStep
  | NameStep
  | PhoneStep
  | EmailStep;

export type IntakeFlow = {
  steps: IntakeStep[];
  closing: IntakePrompt;
};

export const gtIntakeFlow: IntakeFlow = {
  steps: [
    {
      id: "businessType",
      kind: "choice",
      prompt: [
        "Hi, I’m GT’s intake assistant.",
        "What kind of business do you run?",
      ],
      options: [
        "Law firm",
        "Professional services",
        "Home or local services",
        "Healthcare or wellness",
        "Retail or ecommerce",
        "Something else",
      ],
    },
    {
      id: "goal",
      kind: "choice",
      prompt: "What would you most like to improve?",
      options: [
        "Get found in search and AI",
        "Generate more customer inquiries",
        "Respond to leads faster",
        "Improve the whole customer journey",
      ],
    },
    {
      id: "name",
      kind: "name",
      prompt: "Who should GT follow up with?",
    },
    {
      id: "phone",
      kind: "phone",
      prompt: (answers) =>
        `Thanks, ${answers.firstName}. What’s the best phone number to reach you?`,
    },
    {
      id: "email",
      kind: "email",
      prompt: "And what’s the best email for a reply?",
    },
  ],
  closing: [],
};

export function resolvePrompt(
  prompt: IntakePrompt,
  answers: IntakeAnswers,
): string[] {
  const value = typeof prompt === "function" ? prompt(answers) : prompt;
  return Array.isArray(value) ? value : [value];
}
