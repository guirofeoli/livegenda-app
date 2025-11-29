import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      const toastContainer = document.querySelector('[toast-close]')?.closest('div[role="status"]') || 
                            document.querySelector('[toast-close]')?.closest('div[class*="group"]');
      
      if (toastContainer && !toastContainer.contains(e.target)) {
        toasts.forEach(({ id }) => dismiss(id));
      }
    };

    if (toasts.length > 0) {
      document.addEventListener("click", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [toasts, dismiss]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, open, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            open={open}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                dismiss(id);
              }
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose 
              onClick={() => dismiss(id)}
            />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
