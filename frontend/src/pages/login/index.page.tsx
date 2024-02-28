import styles from "./styles.module.scss"
import 'react-toastify/dist/ReactToastify.css';
import Head from "next/head";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput"; 
import { Button } from "@/components/Button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";


const loginFormSchema = z.object({
  email: z.string().email({ message: "Email é obrigatório" }),
  password: z.string().min(6, { message: "Senha é obrigatória" }),
  keep_connected: z.coerce.boolean()
})

type LoginFormData = z.infer<typeof loginFormSchema>

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema)
  })

  const router = useRouter()
  const { signIn } = useAuth()

  const handleSignIn = async (data: LoginFormData) => {
    const hasLogged = await signIn(data)

    if(hasLogged) {
      router.back()
    }
  }


  return(
    <>
      <Head>
        <title>Login - Eventos</title>
      </Head>

      <main className={styles.loginContainer}>
        <ToastContainer />

          <h1>Acesse sua conta</h1>

          <form className={styles.formContainer} onSubmit={handleSubmit(handleSignIn)}>
            <div>
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
              
              <div className={styles.keepConnectedContainer}>
                <input 
                  id="keep-connect" 
                  type="checkbox" 
                  value="true"
                  {...register("keep_connected")}
                  />
                <label htmlFor="keep-connect">Mantenha-me conectado</label>
              </div>
            </div>


            <Button type="submit">Login</Button>
            <p>Esqueceu sua senha? <Link href="#">Clique aqui</Link></p>

            <hr />

            <p>Não possui conta? <Link href="/cadastro">Cadastre-se!</Link></p>
          </form>
      </main>
    </>
  )
}