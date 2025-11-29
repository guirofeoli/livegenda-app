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

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, open, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            open={open}
            onOpenChange={(newOpen) => {
              if (!newOpen) {
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => dismiss(id), 0);
              }}
            />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
