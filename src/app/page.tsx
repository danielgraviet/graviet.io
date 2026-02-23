import Link from "next/link";
import {
  Home as HomeIcon,
  User,
  Mail,
  FolderOpen,
  BookOpen,
  FileText,
  Library,
  Wrench,
  Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const gridItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/about", label: "About", Icon: User },
  { href: "/contact", label: "Contact", Icon: Mail },
  { href: "/projects", label: "Projects", Icon: FolderOpen },
  { href: "/blog", label: "Blog", Icon: BookOpen },
  { href: "/resume.pdf", label: "Resume", Icon: FileText },
  { href: "/library", label: "Library", Icon: Library },
  { href: "/tools", label: "Tools", Icon: Wrench },
  { href: "/lifestyle", label: "Lifestyle", Icon: Heart },
];

export default function Home() {
  return (
    <section className="flex h-[calc(100vh-5rem)] items-center justify-center px-6 pb-20">
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {gridItems.map(({ href, label, Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background/60 py-6 text-text-secondary backdrop-blur-sm transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Icon className="h-6 w-6" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
