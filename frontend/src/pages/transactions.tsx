import { useTransactions } from "@/hooks/use-transactions"

export function TransactionsPage() {
  const { data, isLoading, isError, error, refetch } = useTransactions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando transações...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 space-y-2">
        <p className="font-semibold text-destructive">Erro ao carregar</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm text-primary underline underline-offset-4"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-2">
        <p className="font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm text-muted-foreground">
          Crie a primeira pelo botão "Nova transação" acima.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "transação" : "transações"} no total
      </p>

      <div className="space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div>
              <p className="font-medium">{t.description}</p>
              <p className="text-xs text-muted-foreground">
                {t.category ?? "Sem categoria"} · {t.date}
              </p>
            </div>
            <p
              className={
                t.type === "income"
                  ? "font-semibold text-income"
                  : "font-semibold text-expense"
              }
            >
              {t.type === "income" ? "+" : "-"} R$ {t.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}