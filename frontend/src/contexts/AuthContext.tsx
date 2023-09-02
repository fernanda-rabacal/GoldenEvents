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

  function signOut() {
    destroyCookie(undefined, 'nextauth.token')
  }

  async function signIn({ email, password }: SignInData) {
    try {
      const response = await api.post('/login', {
        email,
        password
      })
      
      if(response.status !== 200) {
        throw new Error(response.data.message) 
      }

      const { user, token } = response.data
      
      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      
      setUser(user)

      router.push('/')
    } catch (err: any) {
      toastNotify('error', err.response.data.message)
    }
  }
  
  async function getUserByToken() {
    const token = parseCookies(null, "nextauth.token")

    if(!token) {
      return setUser(null) 
    }

    try {
      const response = await api.get("/token", {
        headers: {
          'Authorization': `Bearer ${token["nextauth.token"]}`
        }
      })

      console.log(response)
      
      if(response.status !== 200) {
        throw new Error(response.data.message) 
      }

      const { user } = response.data

      setUser(user)
    } catch(err: any) {
      toastNotify('error', err.response.data.message)
    }
  }

  useEffect(() => {
    getUserByToken()
  }, [])
  

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}