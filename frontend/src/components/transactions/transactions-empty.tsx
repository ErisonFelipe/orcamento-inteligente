/**
 * Empty state da lista de transações.
 *
 * Um bom empty state:
 * - Explica o PORQUÊ do vazio (não há dados ainda).
 * - Orienta a AÇÃO ("use o botão X").
 * - Tem identidade visual (ícone grande, cores do tema), para não
 *   parecer "erro" ou "tela em branco".
 *
 * O CTA para criar a transação fica desabilitado nesta sub-etapa (3.4),
 * porque o formulário chega na 3.5. Ao invés de um botão inerte (que
 * frustra), usamos uma instrução clara apontando para o botão do header.
 */

import { ReceiptText } from "lucide-react"

export function TransactionsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ReceiptText className="h-8 w-8" />
      </div>

      <h2 className="mt-4 text-lg font-semibold">Nenhuma transação ainda</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Comece registrando sua primeira receita ou despesa pelo botão
        <span className="mx-1 font-medium text-foreground">
          "Nova transação"
        </span>
        no topo da página.
      </p>
    </div>
  )
}