type AuthHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthHeading({ eyebrow, title, description }: AuthHeadingProps) {
  return (
    <div className='mb-8'>
      <p className='mb-3 text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
        {eyebrow}
      </p>
      <h2 className='text-h1 text-foreground'>{title}</h2>
      <p className='mt-3 text-body leading-7 text-muted-foreground'>
        {description}
      </p>
    </div>
  );
}
