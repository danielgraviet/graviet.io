import { timingSafeEqual } from "node:crypto";

export function verifyToolsPassword(
  submittedPassword: unknown,
  configuredPassword = process.env.SEO_TOOLS_PASSWORD,
) {
  if (typeof submittedPassword !== "string" || !configuredPassword) {
    return false;
  }

  const submitted = Buffer.from(submittedPassword);
  const configured = Buffer.from(configuredPassword);

  return (
    submitted.length === configured.length &&
    timingSafeEqual(submitted, configured)
  );
}
