import styles from './styles.module.scss'
import Head from 'next/head'
import { GetServerSideProps } from "next"

import { api } from "@/lib/axios"
import { AdminLayout } from '@/layouts/AdminLayout'
import { ImageUpload } from '@/components/ImageUpload'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateUserValidationSchema } from '@/utils/schemaValidations'
import { Input } from '@/components/Input'
import { maskDocument } from '@/utils/masks'
import { Select } from '@/components/Select'
import { useMutationData } from '@/hooks/apiHooks'
import { toastNotify } from '@/lib/toastify'
import { useRouter } from 'next/router'
import { Button } from '@/components/Button'

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  document: string;
  user_type: {
    id: number;
    name: string;
  }
}

interface PageProps {
  user: User
  userTypes: {
    id: number;
    name: string;
  }[]
}

type updateUserFormData = z.infer<typeof updateUserValidationSchema>

export default function UserProfile({ user, userTypes } : PageProps) {
  const router = useRouter()
  const { 
    register,
    setValue, 
    handleSubmit, 
    formState: { errors }
  } = useForm<updateUserFormData>({
    resolver: zodResolver(updateUserValidationSchema),
    defaultValues: {
      name: user.name,
      userTypeId: user.user_type.id
    }
  })

  const formattedUserTypes = userTypes?.map(userType => ({
    key: userType.id,
    value: userType.name
  }))

  const { mutate: updateUser, isLoading } = useMutationData(`/user/${user.id}`, 
    'put', 
    data => {
      toastNotify('success', 'Usuário atualizado com sucesso!')
      router.push("/organizador/meus-eventos")
    },
    error => {
      toastNotify('error', error.response.data.message)
    }
  )

  function handleGoBack() {
    router.back()
  }

  function handleUpdateUser(data: updateUserFormData) {
    updateUser(data)
  }

  return (
    <>
      <Head>
        Perfil - Golden Eventos
      </Head>
      <AdminLayout>
        <div className={styles.content}>
          <h2>Perfil</h2>

          <form className={styles.container} onSubmit={handleSubmit(handleUpdateUser)}>
            <div className={styles.formContainer}>
              <ImageUpload 
                onChange={(value: string) => setValue("photo", value)} 
                label='Foto do Evento (PNG ou JPEG de até 2MB)'
                value="/images/photo-placeholder.jpg"
                />

                <div className={styles.fields}>
                  <Input 
                    id="name" 
                    type="text" 
                    label="Nome"
                    placeholder="Nome e sobrenome" 
                    error={errors.name?.message}
                    {...register("name")} 
                    />
                  <Input 
                    type="text" 
                    label="CPF"
                    maxLength={14}
                    value={maskDocument(user.document)}
                    disabled
                    />
                  <Input 
                    id="email" 
                    type="email"
                    label="E-mail" 
                    value={user.email}
                    disabled
                    />

                  <Select 
                    label="Tipo de usuário"
                    placeholder="Tipo de usuário"
                    options={formattedUserTypes} 
                    onChangeSelect={(option) => { setValue("userTypeId", Number(option))}}
                    error={errors.userTypeId?.message}
                    defaultValue={user.user_type.id}
                  />
                </div>
              </div>

              <div className={styles.optionsBtn}>
                <Button type="button" buttonType="secondary" onClick={handleGoBack} disabled={isLoading}>
                  Voltar
                </Button>
                <Button>
                  Salvar
                </Button>
              </div>
          </form>
        </div>
      </AdminLayout>
    </>
  )
}

export const getServerSideProps : GetServerSideProps = async ({ params }) => {
    const userId = String(params?.user_id)
    const response = await api.get(`/user/${userId}`)
    const userTypesResponse = await api.get("/user/types")

    if (!response || !userTypesResponse) {
        return {
          notFound: true,
        }
      }

    return {
        props: {
          user: response.data,
          userTypes: userTypesResponse.data || []
        }
    }
}