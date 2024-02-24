import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeSlash } from "phosphor-react";
import { Input } from '@/components/Input'; 
import styles from "./styles.module.scss"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}


export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false); 

    const handleClickShowPassword = () => {
      setShowPassword((prevValue) => !prevValue);
    };

    return(
      <>
        <div className={styles.passwordContainer}>
          <Input type={showPassword ? "text" : "password"}  {...props} ref={ref} />
            {
              showPassword ? 
              <EyeSlash size={22} onClick={handleClickShowPassword} color='#eba417' /> 
              :
              <Eye size={22} onClick={handleClickShowPassword} color='#484f56' />
            }
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </>
  )
})