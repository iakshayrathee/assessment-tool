import { toast as shadcnToast } from '@/hooks/use-toast';

type ToastMessage = string | ((message: string) => string);

function resolveMessage(message: ToastMessage): string {
  return typeof message === 'function' ? message('') : message;
}

function toastFn(message: ToastMessage) {
  return shadcnToast({ title: resolveMessage(message) });
}

toastFn.success = function (message: ToastMessage) {
  return shadcnToast({ title: resolveMessage(message) });
};

toastFn.error = function (message: ToastMessage) {
  return shadcnToast({ variant: 'destructive', title: resolveMessage(message) });
};

toastFn.loading = function (message: ToastMessage) {
  return shadcnToast({ title: resolveMessage(message) });
};

toastFn.dismiss = function (_id?: string) {
  // shadcn toasts auto-dismiss; no-op for compatibility
};

export default toastFn;
export { toastFn as toast };
