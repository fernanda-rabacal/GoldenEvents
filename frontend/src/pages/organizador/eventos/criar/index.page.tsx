import styles from './styles.module.scss';
import { AdminLayout } from "@/layouts/AdminLayout";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { ChangeEvent, useState } from "react";
import { GetStaticProps } from "next";
import { api } from "@/lib/axios";
import { EventCategory } from '@/@types/interfaces';
import { useRouter } from 'next/router';
import dynamic from "next/dynamic";
import { createEventSchema } from '@/utils/schemaValidations';
import z  from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const RichTextEditor = dynamic(() => import('../../../../components/RichTextEditor'), {
  ssr: false,
})

interface CreateEventPageProps {
  categories: EventCategory[]
}

type createEventFormData = z.infer<typeof createEventSchema>

export default function CreateEvent({ categories }: CreateEventPageProps) {
  const { 
    register, 
    watch, 
    setValue, 
    handleSubmit, 
    formState: { errors, isSubmitting }
  } = useForm<createEventFormData>({
    resolver: zodResolver(createEventSchema)
  })
  
  const [photoSrc, setPhotoSrc] = useState("/images/photo-placeholder.jpg")
  const router = useRouter()

  const formattedCategories = categories?.map(category => ({
    key: category.id,
    value: category.name
  }))

  function handleUploadPhoto(e: ChangeEvent) {

  }

  function handleGoBack() {
    router.back()
  }

  return (
    <AdminLayout>
      <h2 className={styles.pageTitle}>Criar evento</h2>

      <form className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.photoPreview}>
            <span>Imagem do evento (opcional)</span>
            <input type="file" id="photo" onChange={handleUploadPhoto} />

            <label htmlFor="photo">
              <img src={photoSrc} alt="photo preview" />
            </label>
          </div>

          <div className={styles.fields}>
            <Input
              id="name"
              label="Nome do evento *"
              {...register("name")}
              />
            <Input
              id="location"
              label="Local do evento *"
              {...register("location")}
              />
            <div className={styles.numberFields}>
              <Input
                id="capacity"
                type="number"
                min={0}
                label="Capacidade *"
                {...register("capacity")}
                />
              <Input
                id="price"
                type="number"
                min={0}
                label="Preço *"
                {...register("price")}
              />
            </div>

            <div>
              <span>Categoria do evento *</span>
              <Select 
                placeholder="Categoria"
                options={formattedCategories}
                onChangeSelect={(option) => { setValue("category", Number(option) )}}
              />
            </div>

            <div className={styles.datesFields}>
              <Input
                id="start_date"
                type="datetime-local"
                label="Data de início *"
                {...register("start_date")}
                />
              <Input
                id="end_date"
                type="datetime-local"
                label="Data Final (opcional)"
                {...register("end_date")}
              />
            </div>
          </div>
          
          <div className={styles.description}>
            <span>Descrição do Evento *</span>
            <RichTextEditor onChange={(value) => setValue("description", value)} />
          </div>
        </div>

        <div className={styles.optionsBtn}>
          <Button type="button" colorType="white" onClick={handleGoBack}>
              Voltar
          </Button>
          <Button>
              Criar evento
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const categoryData = await api.get("/events/categories")

  return {
    props: {
      categories: categoryData.data.categories
    }
  }
}