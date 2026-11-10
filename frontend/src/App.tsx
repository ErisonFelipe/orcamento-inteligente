import { ModeToggle } from "@/components/mode-toggle"

function App() {
  return (
    <div className="min-h-svh p-8 bg-background space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">
          Teste de tema
        </h1>
        <ModeToggle />
      </div>

      <p className="text-muted-foreground">
        Clique no botão acima e escolha claro, escuro ou sistema.
        A escolha fica salva mesmo após recarregar.
      </p>

      <div className="flex gap-6 text-lg font-semibold">
        <span className="text-income">+ R$ 5.000,00</span>
        <span className="text-expense">- R$ 35,90</span>
      </div>

      <div className="p-4 rounded-lg border border-border bg-card text-card-foreground">
        Este card usa as cores do tema (fundo, borda e texto).
        Ele deve mudar automaticamente ao trocar o tema.
      </div>
    </div>
  )
}

export default App