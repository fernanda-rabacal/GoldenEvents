import styles from './styles.module.scss';
import { GetStaticPaths, GetStaticProps } from "next";
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
import { Event, EventCategory } from '@/@types/interfaces';
import { eventValidationSchema } from '@/utils/schemaValidations';
import { useDeleteData, useMutationData } from '@/hooks/apiHooks';

const RichTextEditor = dynamic(() => import('../../../../components/RichTextEditor'), {
  ssr: false,
})

interface CreateEventPageProps {
  categories: EventCategory[]
  event: Event
}

type createEventFormData = z.infer<typeof eventValidationSchema>

export default function EditEvent({ categories, event }: CreateEventPageProps) {
  const { 
    register,
    setValue, 
    handleSubmit, 
    formState: { errors }
  } = useForm<createEventFormData>({
    resolver: zodResolver(eventValidationSchema),
    defaultValues: {
      description: event.description,
      categoryId: event.category_id,
      capacity: event.capacity,
      location: event.location,
      price: event.price,
      name: event.name,
      photo: event.photo,
      endDateTime: event.end_date?.substring(0, 16),
      startDateTime: event.start_date?.substring(0, 16),
   },
  })
  
  const router = useRouter()
  const { mutate: updateEvent, isLoading: isLoadingUpdate } = useMutationData(`/event/${event.id}`, 
      'put', 
      data => {
        toastNotify('success', 'Evento atualizado com sucesso!')
        router.push("/organizador/meus-eventos")
      },
      error => {
        toastNotify('error', error.response.data.message)
      }
    )

  const { mutate: deleteEvent, isLoading: isLoadingDelete } = useDeleteData(`/event/${event.id}`, 
      'delete', 
      data => {
        toastNotify('success', 'Evento deletado com sucesso!')
        router.push("/organizador/meus-eventos")
      },
      error => {
        toastNotify('error', error.response.data.message)
      }
    )

  const formattedCategories = categories?.map(category => ({
    key: category.id,
    value: category.name
  }))

  function handleGoBack() {
    router.back()
  }

  function handleUpdateEvent(data: createEventFormData) {
    if (event.quantity_left < event.capacity) {
      return toastNotify("error", "Você não pode atualizar o valor do evento pois já existem ingressos comprados.")
    }
    
    updateEvent(data)
  }

  function handleDeleteEvent() {
    const confirm = window.confirm("Tem certeza de que deseja deletar o evento? Todos os ingressos serão invalidados")

    if (!confirm) return;

    deleteEvent()
  }

  return (
    <AdminLayout>
      <h2 className={styles.pageTitle}>Editar evento</h2>

      <form className={styles.container} onSubmit={handleSubmit(handleUpdateEvent)}>
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
                defaultValue={event.category_id}
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
              markdown={event.description}
              label="Descrição do Evento (mínimo 100 caracteres) * "
              onChange={(value: string | undefined) => setValue("description", value || '')} 
              error={errors.description?.message}
              />
          </div>
        </div>

        <div className={styles.optionsBtn}>
          <Button type='button' buttonType="danger" onClick={handleDeleteEvent} disabled={isLoadingDelete}>Excluir Evento</Button>

          <div>
            <Button type="button" buttonType="secondary" onClick={handleGoBack} disabled={isLoadingUpdate || isLoadingDelete}>
                Voltar
            </Button>
            <Button disabled={isLoadingUpdate || isLoadingDelete}>
                Atualizar evento
            </Button>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { data: categoryData } = await api.get("/event/categories")
  const { data: eventData } = await api.get(`/event/${params?.slug}`)

  return {
    props: {
      categories: categoryData,
      event: eventData
    }
  }
}