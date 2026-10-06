'use client';

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

type RichTextEditorProps = {
  label: string;
  markdown: string;
  onChange: (markdown: string) => void;
  error?: string;
};

function Toolbar() {
  return (
    <>
      <BoldItalicUnderlineToggles />
      <ListsToggle />
      <BlockTypeSelect />
    </>
  );
}

// Export default para o next/dynamic: o MDXEditor só funciona no navegador
export default function RichTextEditor({
  label,
  markdown,
  onChange,
  error,
}: RichTextEditorProps) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='text-body-sm font-bold text-foreground/80'>{label}</span>
      <MDXEditor
        markdown={markdown}
        onChange={onChange}
        className='overflow-hidden rounded-2xl border border-input bg-card'
        contentEditableClassName='h-80 overflow-auto px-4 py-3 text-body text-foreground [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6'
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          toolbarPlugin({ toolbarContents: () => <Toolbar /> }),
          markdownShortcutPlugin(),
        ]}
      />
      {error && <span className='text-caption text-destructive'>{error}</span>}
    </div>
  );
}
