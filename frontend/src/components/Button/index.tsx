import { ButtonHTMLAttributes } from "react";
import styles from "./styles.module.scss"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: string | React.ReactNode;
  secondary?: boolean
}

export const Button = ({ children, secondary = false, ...props }: ButtonProps) => {
  return(
    <button 
      className={styles.button} 
      data-secondary={secondary}
      {...props}
      >
      {children}
    </button>
  );
};