import { cookies } from "next/headers";
import { TOOLS_AUTH_COOKIE, verifyToolsAuthToken } from "@/lib/tools-auth";
import ToolsUnlock from "./ToolsUnlock";

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(TOOLS_AUTH_COOKIE)?.value;
  if (!verifyToolsAuthToken(token)) {
    return <ToolsUnlock />;
  }

  return children;
}
