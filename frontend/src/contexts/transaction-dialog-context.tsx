/**
 * Contexto global do dialog de transação.
 *
 * Por que existe:
 * - O BOTÃO que abre o dialog mora no header (layout). O DIALOG em si
 *   precisa ser renderizado uma vez, sobrepondo tudo.
 * - Se cada botão gerenciasse seu próprio estado, teríamos N cópias do
 *   dialog, com estados desincronizados.
 *
 * Solução:
 * - O PROVIDER mantém o estado (aberto/fechado, transação em edição)
 *   e renderiza o `<TransactionFormDialog>` uma única vez.
 * - Qualquer componente (header, item da lista, atalho futuro) consome
 *   o contexto e chama `openCreate()` ou `openEdit(transaction)`.
 *
 * Uso:
 *   const { openCreate, openEdit } = useTransactionDialog()
 *   <Button onClick={openCreate}>Nova</Button>
 *   <Button onClick={() => openEdit(t)}>Editar</Button>
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog"
import type { TransactionRead } from "@/types/transaction"

type TransactionDialogContextValue = {
  openCreate: () => void
  openEdit: (transaction: TransactionRead) => void
}

const TransactionDialogContext =
  createContext<TransactionDialogContextValue | null>(null)

export function TransactionDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TransactionRead | null>(null)

  const openCreate = useCallback(() => {
    setEditing(null)
    setOpen(true)
  }, [])

  const openEdit = useCallback((transaction: TransactionRead) => {
    setEditing(transaction)
    setOpen(true)
  }, [])

  return (
    <TransactionDialogContext.Provider value={{ openCreate, openEdit }}>
      {children}
      <TransactionFormDialog
        open={open}
        onOpenChange={setOpen}
        transaction={editing}
      />
    </TransactionDialogContext.Provider>
  )
}

export function useTransactionDialog(): TransactionDialogContextValue {
  const ctx = useContext(TransactionDialogContext)
  if (!ctx) {
    throw new Error(
      "useTransactionDialog deve ser usado dentro de <TransactionDialogProvider>",
    )
  }
  return ctx
}