import { ButtonHTMLAttributes } from "react";
import styles from "./styles.module.scss"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: string | React.ReactNode;
  colorType?: 'primary' | 'white'
}

export const Button = ({ children, colorType = 'primary', ...props }: ButtonProps) => {
  return(
    <button 
      className={styles.button} 
      {...props}
      data-type={colorType}
      >
      {children}
    </button>
  );
};