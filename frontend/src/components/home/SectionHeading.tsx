type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  align?: 'left' | 'center';
  eyebrowClassName?: string;
  titleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  align = 'left',
  eyebrowClassName = 'text-orange-500',
  titleClassName = '',
}: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'text-center' : undefined}>
      <p
        className={`mb-2 text-body-sm font-bold tracking-eyebrow uppercase ${eyebrowClassName}`}
      >
        {eyebrow}
      </p>
      <h2 className={`text-h2 text-foreground sm:text-h1 ${titleClassName}`}>
        {title}
      </h2>
    </div>
  );
}
