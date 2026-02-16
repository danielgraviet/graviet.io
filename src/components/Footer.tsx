export default function Footer() {
  return (
    <footer className="border-t border-border py-8 text-center text-xs uppercase tracking-[0.15em] text-text-secondary">
      <p>&copy; {new Date().getFullYear()} graviet.io</p>
    </footer>
  );
}
