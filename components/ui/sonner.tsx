"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: <CircleCheck className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        warning: <TriangleAlert className="h-5 w-5" />,
        error: <OctagonX className="h-5 w-5" />,
        loading: <LoaderCircle className="h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:shadow-xl group-[.toaster]:border-l-4 group-[.toaster]:backdrop-blur-sm",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-sm group-[.toast]:opacity-90",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          closeButton:
            "group-[.toast]:bg-background/80 group-[.toast]:text-foreground group-[.toast]:border-border/50 group-[.toast]:hover:bg-muted group-[.toast]:rounded-full",
          success:
            "group-[.toaster]:bg-emerald-500/10 group-[.toaster]:text-emerald-700 dark:group-[.toaster]:text-emerald-300 group-[.toaster]:border-l-emerald-500 [&_svg]:text-emerald-500",
          error:
            "group-[.toaster]:bg-red-500/10 group-[.toaster]:text-red-700 dark:group-[.toaster]:text-red-300 group-[.toaster]:border-l-red-500 [&_svg]:text-red-500",
          warning:
            "group-[.toaster]:bg-amber-500/10 group-[.toaster]:text-amber-700 dark:group-[.toaster]:text-amber-300 group-[.toaster]:border-l-amber-500 [&_svg]:text-amber-500",
          info:
            "group-[.toaster]:bg-blue-500/10 group-[.toaster]:text-blue-700 dark:group-[.toaster]:text-blue-300 group-[.toaster]:border-l-blue-500 [&_svg]:text-blue-500",
          loading:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-l-primary [&_svg]:text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
