/**
 * Skeletons de carregamento da página de Transações.
 *
 * Um skeleton é um "esqueleto" do conteúdo real, exibido enquanto os dados
 * carregam. Ele comunica "estou carregando" sem texto ("Carregando...")
 * e — crucialmente — evita "layout shift": quando os dados chegam, o
 * conteúdo ocupa o MESMO espaço que o skeleton, sem a página "pular".
 *
 * Estrutura visual:
 * - `TransactionsSummarySkeleton`: 3 cards com blocos pulsantes no formato
 *   dos cards reais (título + ícone, valor grande, descrição pequena).
 * - `TransactionsListSkeleton`: 5 linhas no formato dos `TransactionItem`
 *   (ícone circular, 2 linhas de texto, valor).
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TransactionsSummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TransactionsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-24 shrink-0" />
        </div>
      ))}
    </div>
  )
}