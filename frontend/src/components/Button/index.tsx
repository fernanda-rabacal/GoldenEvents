import { ButtonHTMLAttributes } from "react";
import styles from "./styles.module.scss"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: string | React.ReactNode;
  buttonType?: "primary" | "secondary" | "danger"
}

export const Button = ({ children, buttonType = 'primary', ...props }: ButtonProps) => {
  return(
    <button 
      className={styles.button} 
      data-type={buttonType}
      {...props}
      >
      {children}
    </button>
  );
};