import UISFX from "@/components/UISFX";

export default function Footer() {
  return (
    <footer className="px-4 pb-8 text-sm text-text-secondary md:px-8 lg:px-12">
      <p>&copy; {new Date().getFullYear()} Daniel Graviet</p>
      <UISFX />
    </footer>
  );
}
