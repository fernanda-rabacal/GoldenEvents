import { useState } from 'react'
import styles from './styles.module.scss'
import { Dropzone } from '../Dropzone'
import { ErrorMessage } from '../ErrorMessage'

interface ImageUploadProps {
  value: string
  onChange: (...event: string[]) => void
  isError?: boolean
  label?: string
}

export function ImageUpload({ value, onChange, isError: isErrorForm, label }: ImageUploadProps) {
  const [isError, setIsError] = useState(isErrorForm)
  const [messageError, setMessageError] = useState('')
  const [photoSrc, setPhotoSrc] = useState(value)

  function onDrop(acceptedFiles: File[]) {
    // setIsLoading(true)
    const acceptedFile = acceptedFiles[0]

    if (!acceptedFile) {
      // setIsLoading(false)
      setIsError(true)
      setMessageError('Envie no formato: JPG ou PNG')
      return
    }

    if (acceptedFile.size / 1024 > 2048) {
      // setIsLoading(false)
      setIsError(true)
      setMessageError('Tamanho máximo: 2MB')
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(acceptedFile)

    reader.onload = () => {
      const base64 = reader.result as string

      setPhotoSrc(base64)
      onChange(base64)
      // setIsLoading(false)
      setIsError(false)
      setMessageError('')
    }
  }

  return (
    <Dropzone onDrop={onDrop}>
      <div className={styles.photoPreview}>
        <span>{label}</span>

        <img 
          src={photoSrc} 
          alt="photo preview" 
          onError={({ currentTarget }) => {
            currentTarget.onerror = null
            currentTarget.src = "/images/photo-placeholder.jpg"
          }}
          />
      </div>
      {isError && <ErrorMessage>{messageError}</ErrorMessage>}
    </Dropzone>
  )

}