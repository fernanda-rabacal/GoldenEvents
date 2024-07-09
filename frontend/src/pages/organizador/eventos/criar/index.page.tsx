import styles from './styles.module.scss';
import { GetStaticProps } from "next";
import { useRouter } from 'next/router';
import dynamic from "next/dynamic";

import { AdminLayout } from "@/layouts/AdminLayout";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { ImageUpload } from '@/components/ImageUpload';

import { toastNotify } from '@/lib/toastify';
import { useForm } from 'react-hook-form';
import { api } from "@/lib/axios";
import z  from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventCategory } from '@/@types/interfaces';
import { eventValidationSchema } from '@/utils/schemaValidations';
import { useMutationData } from '@/hooks/apiHooks';
import { useEffect } from 'react';
import { maskMoney } from '@/utils/masks';

const RichTextEditor = dynamic(() => import('../../../../components/RichTextEditor'), {
  ssr: false,
})

interface CreateEventPageProps {
  categories: EventCategory[]
}

type createEventFormData = z.infer<typeof eventValidationSchema>

export default function CreateEvent({ categories }: CreateEventPageProps) {
  const router = useRouter()
  const { 
    register,
    setValue, 
    handleSubmit, 
    formState: { errors }
  } = useForm<createEventFormData>({
    resolver: zodResolver(eventValidationSchema),
    defaultValues: {
      description: '',
      categoryId: 0
   }
  })

  const formattedCategories = categories?.map(category => ({
    key: category.id,
    value: category.name
  }))

  const { mutate: createEvent, isLoading } = useMutationData("/event", 
      'post', 
      data => {
        toastNotify('success', 'Evento criado com sucesso!')
        router.push("/organizador/meus-eventos")
      },
      error => {
        toastNotify('error', error.response.data.message)
      }
    )

  function handleGoBack() {
    router.back()
  }

  function handleCreateEvent(data: createEventFormData) {
    //console.log(data)
    createEvent(data)
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
                type="text"
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
                onChangeSelect={(option) => { setValue("categoryId", Number(option))}}
                error={errors.categoryId?.message}
              />
            </div>

            <div className={styles.datesFields}>
              <Input
                id="startDatetime"
                type="datetime-local"
                label="Data de início *"
                error={errors.startDateTime?.message}
                {...register("startDateTime")}
                />
              <Input
                id="endDateTime"
                type="datetime-local"
                label="Data Final (opcional)"
                error={errors.endDateTime?.message}
                {...register("endDateTime")}
              />
            </div>
          </div>
          
          <div className={styles.description}>
            <RichTextEditor 
              markdown=''
              label="Descrição do Evento (mínimo 100 caracteres) * "
              onChange={(value: string | undefined) => setValue("description", value || '')} 
              error={errors.description?.message}
              />
          </div>
        </div>

        <div className={styles.optionsBtn}>
          <Button type="button" buttonType="secondary" onClick={handleGoBack} disabled={isLoading}>
            Voltar
          </Button>
          <Button>
            Atualizar evento
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const categoryData = await api.get("/event/categories")
  
    return {
      props: {
        categories: categoryData.data
      }
    }
  } catch (e) {
    return {
      props: {
        categories: []
      }
    }
  }
}