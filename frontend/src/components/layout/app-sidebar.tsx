import {
  ArrowLeftRight,
  LayoutDashboard,
  Settings,
  Tags,
  Wallet,
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Transações", to: "/transactions", icon: ArrowLeftRight },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Categorias", to: "/categories", icon: Tags },
  { label: "Configurações", to: "/settings", icon: Settings },
]

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card">
      {/* Logo + nome do app */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Orçamento</span>
          <span className="text-xs text-muted-foreground">Inteligente</span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          v0.1.0 · Em desenvolvimento
        </p>
      </div>
    </aside>
  )
}