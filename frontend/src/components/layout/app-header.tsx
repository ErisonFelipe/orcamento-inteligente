import { Plus } from "lucide-react"
import { useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

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
  const info = PAGES[pathname] ?? FALLBACK

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold">{info.title}</h1>
        {info.subtitle ? (
          <p className="truncate text-xs text-muted-foreground">
            {info.subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova transação
        </Button>
        <ModeToggle />
      </div>
    </header>
  )
}