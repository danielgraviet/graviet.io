const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

function plainLearningText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, "$1")
    .replace(/[*_~`>#-]/g, " ")
    .replace(/\\([a-zA-Z]+)/g, "$1")
    .replace(/[{}$^]/g, " ");
}

function words(value: string): Set<string> {
  return new Set(value.toLocaleLowerCase().match(WORD_PATTERN) ?? []);
}

export type LearningCheck = {
  matched: string[];
  answerWordCount: number;
  hasMatch: boolean;
};

export function checkLearningAnswer(
  response: string,
  expectedAnswer: string,
): LearningCheck {
  const responseWords = words(plainLearningText(response));
  const answerWords = words(plainLearningText(expectedAnswer));
  const matched = [...answerWords].filter((word) => responseWords.has(word));

  return {
    matched,
    answerWordCount: answerWords.size,
    hasMatch: matched.length > 0,
  };
}
