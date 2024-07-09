import styles from "./styles.module.scss"
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod";
import z  from 'zod'
import { Button } from "@/components/Button";
import { maskDocument } from "@/utils/masks";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { toastNotify } from "@/lib/toastify";
import { api } from "@/lib/axios";
import { AxiosError } from "axios";

interface IRegister {
  name: string;
  cpf: string;
  email: string;
  password: string;
  confirm_password: string;/* 
  isPromotor: boolean; */
}

const registerFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Digite pelo menos três letras."}),
  email: z
    .string()
    .min(1, { message: "Este campo é obrigatório" })
    .email("Informe um email válido."),
  cpf: z
    .string()
    .min(1, { message: "Este campo é obrigatório" }),
  password: z
    .string()
    .min(1, { message: "Este campo é obrigatório" }),
  confirm_password: z
    .string()
    .min(1, { message: "Este campo é obrigatório" }),
})
.refine((data) => data.password === data.confirm_password, {
  message: "Senhas não conferem.",
  path: ["confirm"],
});

type RegisterFormData = z.infer<typeof registerFormSchema>

export default function RegisterPage() {
  const { 
    register, 
    watch, 
    setValue, 
    handleSubmit, 
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema)
  })

  const cpfValue = watch("cpf")

  useEffect(() => {
    setValue("cpf", maskDocument(cpfValue))

  },[cpfValue])

  const router = useRouter()

  const handleRegister = async (data: IRegister) => {
    try {
      let response = await api.post("/user", data)
  
      if(response.status !== 200) {
        return toastNotify('error', response.data.message)
      }
      
      toastNotify('success', "Cadastro feito com Sucesso!")
      router.push('/login')
    } catch (e: any) {
      toastNotify('error', e.response?.data?.message)
    }
  }

  return(
    <>
      <Head>
        <title>Cadastro - Golden Eventos</title>
      </Head>

      <main className={styles.registerContainer}>
        <h1>Cadastre-se, é rápido!</h1>

        <div className={styles.registerContent}>
          <form className={styles.formContainer} onSubmit={handleSubmit(handleRegister)}>
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
                {...register("cpf")}
                 />
              <Input 
                id="email" 
                type="email"
                label="E-mail" 
                {...register("email")} 
                error={errors.email?.message}
                />
              <PasswordInput 
                id="password"  
                label="Senha"
                placeholder="Pelo menos 6 caracteres"
                error={errors.password?.message}  
                {...register("password")} 
              />
              <PasswordInput 
                id="confirm_password" 
                label="Confirmar senha" 
                error={errors.confirm_password?.message}
                {...register("confirm_password")} 
              />
              <Button disabled={isSubmitting}>Cadastrar</Button>

              <p>Já possui uma conta? <Link href="/login">Faça login</Link></p>
          </form>

          <div className={styles.infosContainer}>
            <h2>Crie eventos que irão ficar marcados na memória</h2>
            <img src="/images/timetable.png" alt=""/>
          </div>
        </div>
      </main>
    </>
  )
}