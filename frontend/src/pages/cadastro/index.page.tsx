import Head from "next/head";
import Link from "next/link";
import { useEffect } from 'react'
import {  useForm } from "react-hook-form"
import { Button } from "@/components/Button";
import { mask } from "@/utils/mask";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { api } from "@/lib/axios";
import z  from 'zod'
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./styles.module.scss"
import { useRouter } from "next/router";
import { toastNotify } from "@/lib/toastify";

interface IRegister {
  name: string;/* 
  cpf: string; */
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

  /* const cpfValue = watch("cpf")

  useEffect(() => {
    setValue("cpf", mask(cpfValue))

  },[cpfValue])
 */

  const router = useRouter()

  const handleRegister = async (data: IRegister) => {
    let response = await api.post("/register", data)

    console.log(data)

    if(response.status !== 200) {
      return toastNotify('error', "Erro")
    }
    
    toastNotify('success', "Cadastro feito com Sucesso!")

    console.log(response)
  }

  return(
    <>
      <Head>
        <title>Cadastro - Eventos</title>
      </Head>

      <main className={styles.registerContainer}>
        <h1>Cadastre-se, é rápido!</h1>

        <div className={styles.registerContent}>
          <form className={styles.formContainer} onSubmit={handleSubmit(handleRegister)}>
              <div>
                <label htmlFor="name">Nome</label>
                <Input id="name" type="text" placeholder="Nome e sobrenome" {...register("name")} />
                {errors.name && <p className={styles.formError}>{errors.name.message}</p>}
              </div>
              {/* <div>
                <label htmlFor="cpf">CPF</label>
                <Input type="text" maxLength={14}
                {...register("cpf")} />
              </div> */}
              <div>
                <label htmlFor="email">E-mail</label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className={styles.formError}>{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="password">Senha</label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Pelo menos 6 caracteres"  
                  {...register("password")} 
                  />
                {errors.password && <p className={styles.formError}>{errors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="confirm_password">Confirme a senha</label>
                <Input 
                  id="confirm_password" 
                  type="password"  
                  {...register("confirm_password")} 
                  />
                {errors.confirm_password && <p className={styles.formError}>{errors.confirm_password.message}</p>}
              </div>
              {/* <div className={styles.isPromoter}>
                <p>Deseja criar eventos?</p>
                  <div>
                    <Input id="true" type="radio" value={1} {...register("isPromotor")} />
                    <label htmlFor="true">Sim</label>
                  </div>
                  <div>
                    <Input id="false" type="radio" value={0} {...register("isPromotor")}/>
                    <label htmlFor="false">Não</label>
                  </div>
              </div> */}
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