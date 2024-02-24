import { api } from "@/lib/axios";
import { ReactNode, createContext, useEffect, useState } from "react"
import { setCookie, destroyCookie, parseCookies } from 'nookies'
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
  keep_connected: boolean
}

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (data: SignInData) => Promise<boolean>;
  signOut: () => void
}

export const AuthContext = createContext({} as AuthContextType)

export function AuthContextProvider({ children } : AuthProps) {
  const [user, setUser] = useState<User | null>(null)

  const isAuthenticated = !!user;

  function signOut() {
    destroyCookie(undefined, 'golden_token')
  }

  async function signIn({ email, password, keep_connected }: SignInData) {
    try {
      const response = await api.post('/users/login', {
        email,
        password
      })

      const { user, token } = response.data

      const maxAge = keep_connected ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 30 //7 days or 30 days
      
      setCookie(undefined, 'golden_token', token, { maxAge })
      
      setUser(user)

      return true
    } catch (err: any) {
      toastNotify('error', err.response.data.message)

      return false
    }
  }

  async function getUserByToken() {
    const { golden_token } = parseCookies()

    if(!golden_token) {
      return setUser(null) 
    }

    try {
      const response = await api.get("/users/token", {
        headers: {
          'Authorization': `Bearer ${golden_token}`,
          'Access-Control-Allow-Origin': '*',
        }
      })

      if(response.status !== 200) {
        throw new Error(response.data.message) 
      }

      const { user } = response.data

      setUser(user)
    } catch(err: any) {
      toastNotify('error', err.response?.data?.message)
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