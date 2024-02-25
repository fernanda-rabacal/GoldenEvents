import 'suneditor/dist/css/suneditor.min.css';
import { buttonList } from "suneditor-react";
import dynamic from 'next/dynamic';
import { ErrorMessage } from '../ErrorMessage';

const SunEditor = dynamic(() => import('suneditor-react'), {
  ssr: false,
})

interface RichTextProps {
  error?: string
  label?: string
  name: string
  onChange: (value: string) => void
}

export default function RichTextEditor({ onChange, name, error, label }: RichTextProps) {
  return (
    <div>
      <label>{label}</label>
      <SunEditor 
        height="300"
        name={name}
        onChange={onChange} 
        setOptions={{
          buttonList: buttonList.complex
        }} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}