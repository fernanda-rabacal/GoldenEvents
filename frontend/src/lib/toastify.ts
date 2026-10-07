import { TypeOptions, toast } from 'react-toastify';

const toastProps = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
} as const;

type ToastType = Exclude<TypeOptions, 'default'>;

export const toastNotify = (type: ToastType, message: string) => {
  return toast[type](message, toastProps);
};
