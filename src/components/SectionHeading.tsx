interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl">{title}</h2>
      {subtitle && (
        <p className="mt-2 leading-relaxed text-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}
