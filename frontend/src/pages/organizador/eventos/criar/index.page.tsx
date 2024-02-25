import styles from './styles.module.scss';
import { AdminLayout } from "@/layouts/AdminLayout";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { ChangeEvent, useEffect, useState } from "react";
import { GetStaticProps } from "next";
import { api } from "@/lib/axios";
import { EventCategory } from '@/@types/interfaces';
import { useRouter } from 'next/router';
import dynamic from "next/dynamic";
import { createEventSchema } from '@/utils/schemaValidations';
import z  from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageUpload } from '@/components/ImageUpload';

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
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      description: '',
      category: 0
   }
  })
  const router = useRouter()

  const formattedCategories = categories?.map(category => ({
    key: category.id,
    value: category.name
  }))

  function handleGoBack() {
    router.back()
  }

  function handleCreateEvent(data: createEventFormData) {
    console.log(data)
  }

  return (
    <AdminLayout>
      <h2 className={styles.pageTitle}>Criar evento</h2>

      <form className={styles.container} onSubmit={handleSubmit(handleCreateEvent)}>
        <div className={styles.formContainer}>
          <ImageUpload 
            onChange={(value: string) => setValue("photo", value)} 
            label='Foto do Evento (PNG ou JPEG de até 2MB)'
            value="/images/photo-placeholder.jpg"
            />

          <div className={styles.fields}>
            <Input
              id="name"
              label="Nome do evento *"
              error={errors.name?.message}
              {...register("name")}
              />
            <Input
              id="location"
              label="Local do evento *"
              error={errors.location?.message}
              {...register("location")}
              />
            <div className={styles.numberFields}>
              <Input
                id="capacity"
                type="number"
                min={0}
                label="Capacidade *"
                error={errors.capacity?.message}
                {...register("capacity")}
                />
              <Input
                id="price"
                type="number"
                min={0}
                label="Preço *"
                error={errors.price?.message}
                {...register("price")}
              />
            </div>

            <div>
              <Select 
                label="Categoria do evento *"
                placeholder="Categoria"
                options={formattedCategories} 
                onChangeSelect={(option) => { setValue("category", Number(option) )}}
                error={errors.category?.message}
              />
            </div>

            <div className={styles.datesFields}>
              <Input
                id="start_date"
                type="datetime-local"
                label="Data de início *"
                error={errors.start_date?.message}
                {...register("start_date")}
                />
              <Input
                id="end_date"
                type="datetime-local"
                label="Data Final (opcional)"
                error={errors.end_date?.message}
                {...register("end_date")}
              />
            </div>
          </div>
          
          <div className={styles.description}>
            <RichTextEditor 
              name="description"
              label="Descrição do Evento (mínimo 100 caracteres) * "
              onChange={(value) => setValue("description", value)} 
              error={errors.description?.message}
              />
          </div>
        </div>

        <div className={styles.optionsBtn}>
          <Button type="button" secondary onClick={handleGoBack}>
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