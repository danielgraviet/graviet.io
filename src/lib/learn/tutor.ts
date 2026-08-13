/**
 * v1.1 seam for in-app module teaching.
 *
 * v1 does not call an LLM. Swap these function bodies later
 * (Anthropic/OpenAI via LEARN_LLM_API_KEY) — callers and schema stay the same.
 * Passing a module should insert a learn_card with source: "tutor".
 */

export type TutorModule = {
  title: string;
  body: string;
  question: string;
  rubric: string;
  modelAnswer: string;
};

export async function planModules(
  _topicTitle: string,
  _notes?: string,
): Promise<TutorModule[]> {
  return [];
}

export async function teachModule(
  _topicTitle: string,
  _moduleIndex: number,
): Promise<TutorModule | null> {
  return null;
}

export async function gradeAnswer(_input: {
  question: string;
  rubric: string;
  answer: string;
}): Promise<{ pass: boolean; feedback: string }> {
  return {
    pass: false,
    feedback: "In-app tutoring is not enabled yet. Paste Q/A from your lesson instead.",
  };
}
