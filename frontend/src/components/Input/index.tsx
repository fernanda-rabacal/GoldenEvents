import styles from "./input.module.scss"
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({error, label, className, id, ...props }, ref) => {
  
  return(
    <div className={styles.inputContainer}>
      <label htmlFor={id}>{label}</label>
      <input className={styles.input} id={id} {...props} ref={ref} />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  )
})