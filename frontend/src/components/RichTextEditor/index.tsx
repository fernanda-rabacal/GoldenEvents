import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorProps,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  ListsToggle,
  BlockTypeSelect
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { ErrorMessage } from '../ErrorMessage';
import styles from './styles.module.scss'


interface RichTextProps extends MDXEditorProps {
  error?: string
  label?: string
}

export function Toolbar() {
  return (
    <>
      <BoldItalicUnderlineToggles />
      <ListsToggle />
      <BlockTypeSelect />
    </>
  )
}

export default function RichTextEditor({ error, label, ...props }: RichTextProps) {
  return (
    <div>
      <label>{label}</label>
      <MDXEditor
        contentEditableClassName={styles.content}
        className={styles.richTextContainer}
        plugins={[
          // Example Plugin Usage
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          toolbarPlugin({toolbarContents: () => <Toolbar />}),
          markdownShortcutPlugin(),
        ]}
        {...props}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}

RichTextEditor.displayName = 'RichTextEditor'