import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/use-categories"
import { categoryFormSchema, type CategoryFormValues } from "@/lib/category-schema"
import type { CategoryRead } from "@/types/category"

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CategoryRead | null
}

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4"]

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const isEdit = Boolean(category)
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", color: DEFAULT_COLORS[0] },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        category
          ? { name: category.name, color: category.color }
          : { name: "", color: DEFAULT_COLORS[0] }
      )
    }
  }, [open, category, form])

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, payload: values })
        toast.success("Categoria atualizada", { description: values.name })
      } else {
        await createMutation.mutateAsync(values)
        toast.success("Categoria criada", { description: values.name })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar categoria")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            Dê um nome e escolha uma cor para identificar visualmente.
          </DialogDescription>
        </DialogHeader>

        <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex.: Alimentação"
              autoComplete="off"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex items-center gap-3">
              {/* Input nativo de cor estilizado */}
              <Input
                id="color"
                type="color"
                className="h-10 w-14 cursor-pointer p-1"
                {...form.register("color")}
              />
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                    onClick={() => form.setValue("color", c, { shouldValidate: true })}
                  />
                ))}
              </div>
            </div>
            {form.formState.errors.color && (
              <p className="text-xs text-destructive">{form.formState.errors.color.message}</p>
            )}
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}