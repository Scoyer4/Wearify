import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (msg: string) => sonnerToast.success(msg),
  error:   (msg: string) => sonnerToast.error(msg),
  info:    (msg: string) => sonnerToast.info(msg),
  warning: (msg: string) => sonnerToast.warning(msg),
  loading: (msg: string) => sonnerToast.loading(msg),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: <T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string | ((err: unknown) => string) },
  ) => sonnerToast.promise(promise, msgs),
};
