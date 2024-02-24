import 'suneditor/dist/css/suneditor.min.css';
import { buttonList } from "suneditor-react";
import dynamic from 'next/dynamic';

const SunEditor = dynamic(() => import('suneditor-react'), {
  ssr: false,
})

interface RichTextProps {
  onChange: (value: string) => void
}

export default function RichTextEditor({ onChange }: RichTextProps) {
  return (
    <SunEditor onChange={onChange} height="300" setOptions={{
      buttonList: buttonList.complex
    }} />
  )
}