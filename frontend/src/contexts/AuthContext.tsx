import { api } from "@/lib/axios";
import { ReactNode, createContext, useEffect, useState } from "react"
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import Router, { useRouter } from 'next/router'
import { toastNotify } from "@/lib/toastify";

interface AuthProps {
  children: ReactNode
}

type User = {
  name: string;
  email: string;
  password: string;
}

type SignInData = {
  email: string;
  password: string;
}

type SignInResponseData = {
  data: {
    token: string;
    user: User 
  }
}

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => void
}

export const AuthContext = createContext({} as AuthContextType)

export function AuthContextProvider({ children } : AuthProps) {
  const [user, setUser] = useState<User | null>(null)

  const isAuthenticated = !!user;

  const router = useRouter()

 /*  useEffect(() => {
    async function getUser() {
      const { 'nextauth.token': token } = parseCookies()
  
      if (token && !user) {
        const user : User = await api.get("/users/recover", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        setUser(user)
      }
    }

    getUser()
  }, [])
 */
  function signOut() {
    destroyCookie(undefined, 'nextauth.token')
  }

  async function signIn({ email, password }: SignInData) {
    try {
      const { data: { token, user }} : SignInResponseData = await api.post('/login', {
        email,
        password
      })
      
      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      
      setUser(user)

      router.push('/')
    } catch (err: any) {
      toastNotify('error', err.response.data.message)
    }
  }


  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}