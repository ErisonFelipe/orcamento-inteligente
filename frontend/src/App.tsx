import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-4">
      <h1 className="text-3xl font-bold">Orçamento Inteligente</h1>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Abrir modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova transação</DialogTitle>
            <DialogDescription>
              Este é um exemplo de modal com shadcn/ui.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App