/**
 * Estado de erro da página de Transações.
 *
 * Diferente do empty state, aqui houve uma falha ao carregar.
 * Mostramos:
 * - Ícone de alerta.
 * - Mensagem amigável (a `error.message` já é humanizada pelo interceptor
 *   em `services/api.ts` — ex.: "Sem conexão com o servidor.").
 * - Botão "Tentar novamente" — chama `refetch()` do TanStack Query.
 *
 * Padrão de UX: NUNCA mostrar "Error: undefined" ou stack traces. O
 * usuário final só precisa saber: (a) o que aconteceu, (b) o que fazer.
 */

import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

type TransactionsErrorProps = {
  error: Error | null
  onRetry: () => void
}

export function TransactionsError({ error, onRetry }: TransactionsErrorProps) {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível carregar as transações."

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h2 className="mt-4 text-lg font-semibold">Algo deu errado</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>

      <Button onClick={onRetry} variant="outline" className="mt-6 gap-2">
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}