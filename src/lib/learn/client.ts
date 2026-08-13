export const LEARN_PASSWORD_KEY = "learn_tools_password";

export function getLearnPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(LEARN_PASSWORD_KEY) ?? "";
}

export function setLearnPassword(password: string) {
  sessionStorage.setItem(LEARN_PASSWORD_KEY, password);
}

export function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function learnQuery(password: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({ password, today: localToday(), ...extra });
  return params.toString();
}
