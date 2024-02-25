import { ReactNode } from 'react'
import { useDropzone } from 'react-dropzone'

interface DropzoneProps {
  children: ReactNode;
  className?: string;
  onDrop: (acceptedFiles: File[]) => void;
  multiple?: boolean;
  maxFiles?: number 
}

export const Dropzone = ({ onDrop, className, children, multiple = false, maxFiles = 1 }: DropzoneProps) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles,
    multiple,
  })

  return (
    <div className={className} {...getRootProps({ 'aria-label': 'drag and drop area', role: 'button' })}>
      <input {...getInputProps()} />
      {children}
    </div>
  )
}
