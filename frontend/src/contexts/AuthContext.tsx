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
  const { golden_token } = parseCookies()
  const [user, setUser] = useState<User | null>(null)

  const isAuthenticated = !!user;

  function signOut() {
    destroyCookie(undefined, 'golden_token')
    setUser(null)
  }

  async function signIn({ email, password, keep_connected }: SignInData) {
    try {
      const response = await api.post('/login', {
        email,
        password
      })

      const { token } = response.data

      const maxAge = keep_connected ? 60 * 60 * 24 * 30 : 60 * 60 //7 days or 30 days
      
      setCookie(undefined, 'golden_token', token, { maxAge })
      
      await getUserByToken(token)

      return true
    } catch (err: any) {
      toastNotify('error', err.response.data.message)

      return false
    }
  }

  async function getUserByToken(token: string) {
    try {
      const response = await api.get("/user/token", {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if(response.status !== 200) {
        throw new Error(response.data.message) 
      }

      const user = response.data

      setUser(user)
    } catch(err: any) {
      if (err.status === 401) {
        return destroyCookie(undefined, 'golden_token')
      }

      toastNotify('error', err.response?.data?.message)
    }
  }

  useEffect(() => {
    if (golden_token) {
      getUserByToken(golden_token)
    }
  }, [golden_token])
  

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}