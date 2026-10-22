import type { Metadata } from "next";
import GTIntakeInbox from "./GTIntakeInbox";

export const metadata: Metadata = {
  title: "GT Inquiries",
};

export default function GTIntakePage() {
  return <GTIntakeInbox />;
}
