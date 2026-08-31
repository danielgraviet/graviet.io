const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

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
  const responseWords = words(response);
  const answerWords = words(expectedAnswer);
  const matched = [...answerWords].filter((word) => responseWords.has(word));

  return {
    matched,
    answerWordCount: answerWords.size,
    hasMatch: matched.length > 0,
  };
}
