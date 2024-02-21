import dynamic from "next/dynamic";
import 'suneditor/dist/css/suneditor.min.css';
import { buttonList } from "suneditor-react";

const SunEditor = dynamic(() => import("suneditor-react"), {
  ssr: false,
});


export function RichTextEditor() {

  return (
    <SunEditor height="300" setOptions={{
      buttonList: buttonList.complex
    }} />
  )
}