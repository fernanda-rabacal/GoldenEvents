'use client';

import { useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHOTO_PLACEHOLDER = '/images/photo-placeholder.jpg';
const MAX_SIZE_IN_BYTES = 2 * 1024 * 1024;

type ImageUploadProps = {
  label: string;
  defaultValue?: string | null;
  onChange: (base64: string) => void;
};

function getRejectionMessage([rejection]: FileRejection[]) {
  const isTooLarge = rejection?.errors.some(
    ({ code }) => code === 'file-too-large',
  );

  return isTooLarge ? 'Tamanho máximo: 2MB' : 'Envie no formato: JPG ou PNG';
}

export function ImageUpload({
  label,
  defaultValue,
  onChange,
}: ImageUploadProps) {
  const [preview, setPreview] = useState(defaultValue || PHOTO_PLACEHOLDER);
  const [error, setError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_SIZE_IN_BYTES,
    onDrop(acceptedFiles, rejections) {
      const [file] = acceptedFiles;

      if (!file) {
        setError(getRejectionMessage(rejections));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        setPreview(base64);
        setError('');
        onChange(base64);
      };
      reader.readAsDataURL(file);
    },
  });

  return (
    <div className='flex flex-col gap-2'>
      <span className='text-body-sm font-bold text-foreground/80'>{label}</span>
      <div
        {...getRootProps({ 'aria-label': label })}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-input bg-card transition hover:border-ring',
          isDragActive && 'border-ring',
        )}
      >
        <input {...getInputProps()} />
        <img
          src={preview}
          alt=''
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = PHOTO_PLACEHOLDER;
          }}
          className='aspect-video w-full object-cover'
        />
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/50 text-center text-body-sm font-bold text-white opacity-0 transition group-hover:opacity-100'>
          <ImagePlus className='size-6' />
          Arraste ou clique para selecionar uma foto
        </div>
      </div>
      {error && <span className='text-caption text-destructive'>{error}</span>}
    </div>
  );
}
