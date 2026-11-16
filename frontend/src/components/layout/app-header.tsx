import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Plus, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useTransactionDialog } from "@/contexts/transaction-dialog-context"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarContent } from "./app-sidebar"

type PageInfo = {
  title: string
  subtitle: string
}

const PAGES: Record<string, PageInfo> = {
  "/transactions": {
    title: "Transações",
    subtitle: "Gerencie suas receitas e despesas",
  },
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Visão geral das suas finanças",
  },
  "/categories": {
    title: "Categorias",
    subtitle: "Organize seus gastos por categoria",
  },
  "/settings": {
    title: "Configurações",
    subtitle: "Preferências do aplicativo",
  },
}

const FALLBACK: PageInfo = {
  title: "Orçamento Inteligente",
  subtitle: "",
}

export function AppHeader() {
  const { pathname } = useLocation()
  const { openCreate } = useTransactionDialog()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const info = PAGES[pathname] ?? FALLBACK

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          {/* Usando o próprio trigger com as classes do Botão para evitar botão dentro de botão */}
          <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SidebarContent onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{info.title}</h1>
          {info.subtitle ? (
            <p className="truncate text-xs text-muted-foreground">
              {info.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova transação</span>
          <span className="sr-only sm:hidden">Nova transação</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  )
}