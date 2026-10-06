import { CreateEventProps } from "@/@types/interfaces";
import { api } from "@/lib/axios";
import { toastNotify } from "@/lib/toastify";
import { parseCookies } from "nookies";
import { ReactNode, createContext, useEffect, useState } from "react";

interface EventContextProps {
  children: ReactNode
}

type EventContextData = {
  createEvent: (data: CreateEventProps) => Promise<void>;
  updateEvent: (eventId: string, data: CreateEventProps) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

export const EventContext = createContext({} as EventContextData)

export function EventContextProvider({ children } : EventContextProps) {
  const [token, setToken] = useState<string | null>('')
  const [events, setEvents] = useState([])
  
  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies()
    
    setToken(token)
  }, [])

  async function createEvent(eventData: CreateEventProps) {
    if(!token) {
      toastNotify('error', "Você não possui autorização.") 
      return;
    }

    try {
      const data = await api.post('/events', eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

      toastNotify('success', data.data.message)
    } catch (err: any) {
      toastNotify('error', err.response.data.message)
    }
  }

  async function updateEvent(eventId: string, eventData: CreateEventProps) {
    if(!token) {
      toastNotify('error', "Você não possui autorização.") 
      return;
    }

    try {
      const data = await api.patch(`/events/${eventId}`, eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

      toastNotify('success', data.data.message)
    } catch (err: any) {
      toastNotify('error', err.response.data.message)
    }
  }

  async function deleteEvent(eventId: string) {
    if(!token) {
      toastNotify('error', "Você não possui autorização.") 
      return;
    }

    try {
      const data = await api.delete(`/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

      toastNotify('success', data.data.message)
    } catch (err: any) {
      toastNotify('error', err.response.data.message)
    }
  }

  return (
    <EventContext.Provider value={{
      createEvent,
      updateEvent,
      deleteEvent
    }}>
      { children }
    </EventContext.Provider>
  )
}
