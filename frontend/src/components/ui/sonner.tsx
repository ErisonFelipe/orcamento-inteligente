/**
 * Toaster global — sincroniza o tema (claro/escuro) com `next-themes`.
 *
 * O Sonner tem dark mode próprio. Sem esta integração, os toasts
 * ficariam claros mesmo com o app em modo escuro. Aqui lemos o tema
 * atual (via `useTheme`) e passamos para o `<Toaster>`.
 */

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      richColors
      {...props}
    />
  )
}

export { Toaster }