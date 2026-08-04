import Swal from "sweetalert2";

export const showSuccessToast = (message: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
  Toast.fire({
    icon: 'success',
    title: message
  });
};

export const showErrorToast = (message: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
  Toast.fire({
    icon: 'error',
    title: message
  });
};

export const showWarningToast = (message: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
  Toast.fire({
    icon: 'warning',
    title: message
  });
};

export const showSuccessAlert = async (title: string, message?: string) => {
  return await Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonColor: '#10b981',
    confirmButtonText: 'OK'
  });
};

export const showErrorAlert = async (title: string, message?: string) => {
  return await Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Entendi'
  });
};


export const showConfirmDialog = async (
  title: string,
  text: string,
  confirmText: string = 'Sim, confirmar',
  cancelText: string = 'Cancelar'
): Promise<boolean> => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });
  return result.isConfirmed;
};

