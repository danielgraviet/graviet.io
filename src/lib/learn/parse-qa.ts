export type ParsedCard = {
  front: string;
  back: string;
};

/**
 * Pull Q/A pairs from pasted lesson notes.
 * Accepts lines like `Q: ...` / `A: ...` or `Q.` / `A.`.
 */
export function parseQaPairs(notes: string): ParsedCard[] {
  const lines = notes.split(/\r?\n/);
  const cards: ParsedCard[] = [];
  let front: string[] = [];
  let back: string[] = [];
  let mode: "none" | "front" | "back" = "none";

  function flush() {
    const q = front.join("\n").trim();
    const a = back.join("\n").trim();
    if (q && a) cards.push({ front: q, back: a });
    front = [];
    back = [];
    mode = "none";
  }

  for (const line of lines) {
    const question = line.match(/^\s*Q[:.]\s*(.*)$/i);
    const answer = line.match(/^\s*A[:.]\s*(.*)$/i);

    if (question) {
      if (front.length && back.length) flush();
      mode = "front";
      front = question[1] ? [question[1]] : [];
      back = [];
      continue;
    }

    if (answer) {
      mode = "back";
      back = answer[1] ? [answer[1]] : [];
      continue;
    }

    if (mode === "front") front.push(line);
    else if (mode === "back") back.push(line);
  }

  flush();
  return cards;
}
