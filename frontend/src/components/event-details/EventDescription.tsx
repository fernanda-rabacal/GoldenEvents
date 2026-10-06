import Markdown, { type Components } from 'react-markdown';

const markdownComponents: Components = {
  h1: (props) => <h3 className='text-h4 text-foreground' {...props} />,
  h2: (props) => <h3 className='text-h4 text-foreground' {...props} />,
  h3: (props) => <h3 className='text-h4 text-foreground' {...props} />,
  ul: (props) => <ul className='list-disc space-y-1 pl-5' {...props} />,
  ol: (props) => <ol className='list-decimal space-y-1 pl-5' {...props} />,
  strong: (props) => <strong className='text-foreground' {...props} />,
  a: (props) => (
    <a
      className='font-bold text-accent-foreground underline underline-offset-4'
      target='_blank'
      rel='noreferrer'
      {...props}
    />
  ),
};

export function EventDescription({ markdown }: { markdown: string }) {
  return (
    <div className='max-w-2xl space-y-4 text-body leading-8 text-muted-foreground'>
      <Markdown components={markdownComponents}>{markdown}</Markdown>
    </div>
  );
}
