import { TypeOptions, toast } from "react-toastify";

const toastProps = {
  position: toast.POSITION.TOP_RIGHT,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined
};

type ToastType = Exclude<TypeOptions, 'default'>

export const toastNotify = (type: ToastType, message: string) => {
    return toast[type](message, toastProps)
}