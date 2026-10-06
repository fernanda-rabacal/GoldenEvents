import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { VisibilityOffOutlined, VisibilityOutlined } from "@mui/icons-material";
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
              <VisibilityOffOutlined sx={{ fontSize: 22 }} onClick={handleClickShowPassword} htmlColor='#eba417' /> 
              :
              <VisibilityOutlined sx={{ fontSize: 22 }} onClick={handleClickShowPassword} htmlColor='#484f56' />
            }
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </>
  )
})