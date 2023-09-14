import { Event } from "@/@types/interfaces";
import { ReactNode, createContext, useEffect, useState } from "react";

interface CartContextProviderProps {
    children: ReactNode
}

interface CartEvent extends Event {
    quantity: number;
    price: number;
}

interface CartContextType {
    event: CartEvent | null;
    addEventToCart: (event: CartEvent) => void;
    removeEventFromCart: () => void;
    changeEventQuantity: (type: "increase" | "decrease") => void;
}

const CART_EVENT_STORAGE_KEY = "event:1.1"

export const CartContext = createContext({} as CartContextType)

export function CartContextProvider({ children } : CartContextProviderProps) {
    const [event, setEvent] = useState<CartEvent | null>(null)

    const addEventToCart = (event : CartEvent) => {
        setEvent(event)
    }

    const removeEventFromCart = () => {
        setEvent(null)
    }

    const changeEventQuantity = (type: "increase" | "decrease") => {
        if(event) {
            const updatedEvent = {
                ...event,
                quantity: type === 'increase' ? event.quantity + 1 : event.quantity - 1
            }

            console.log("teste")
            setEvent(updatedEvent)
        }
    }

    useEffect(() => {
        const storedCartEvent = localStorage.getItem(CART_EVENT_STORAGE_KEY)

        if(typeof storedCartEvent === "string") {
            const parsedEvent = JSON.parse(storedCartEvent)

            setEvent(parsedEvent)
        }
    }, [])

    useEffect(() => {
        if(event) {
            localStorage.setItem(CART_EVENT_STORAGE_KEY, JSON.stringify(event))
        }
    }, [event])

    return (
        <CartContext.Provider value={{
            event,
            addEventToCart,
            removeEventFromCart,
            changeEventQuantity,
        }}>
            { children }
        </CartContext.Provider>
    )
}