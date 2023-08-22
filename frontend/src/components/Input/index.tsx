import styles from "./input.module.scss"
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  
  return(
    <input className={styles.input} {...props} ref={ref}/>
  )
})