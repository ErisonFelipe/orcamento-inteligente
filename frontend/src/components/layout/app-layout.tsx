import type { ReactNode } from "react"

import { TransactionDialogProvider } from "@/contexts/transaction-dialog-context"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TransactionDialogProvider>
      <div className="flex min-h-svh bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          {/* p-4 no mobile, p-6 no desktop */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </TransactionDialogProvider>
  )
}