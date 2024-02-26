import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeSlash } from "phosphor-react";
import { Input } from '@/components/Input'; 
import styles from "./styles.module.scss"
import { ErrorMessage } from '../ErrorMessage';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}


export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false); 

    const handleClickShowPassword = () => {
      setShowPassword((prevValue) => !prevValue);
    };

    return(
      <>
        <div className={styles.passwordContainer}>
          {label && <label htmlFor={id}>{label}</label>}
          <Input id={id} type={showPassword ? "text" : "password"}  {...props} ref={ref} />
            {
              showPassword ? 
              <EyeSlash size={22} onClick={handleClickShowPassword} color='#eba417' /> 
              :
              <Eye size={22} onClick={handleClickShowPassword} color='#484f56' />
            }
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </>
  )
})