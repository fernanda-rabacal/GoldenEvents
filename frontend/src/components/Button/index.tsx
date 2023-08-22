import { ButtonHTMLAttributes } from "react";
import styles from "./styles.module.scss"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: string | React.ReactNode 
}

export const Button = ({ children, ...props }: ButtonProps) => {
  return(
    <button 
      className={styles.button} 
      {...props}
      >
      {children}
    </button>
  );
};