import { TransactionItem } from "./transaction-item"
import type { TransactionRead } from "@/types/transaction"

type TransactionsListProps = {
  items: TransactionRead[]
}

export function TransactionsList({ items }: TransactionsListProps) {
  return (
    <div className="space-y-2">
      {items.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  )
}