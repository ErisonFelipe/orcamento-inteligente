import { useState } from "react"
import { Plus, Tags, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryFormDialog } from "@/components/categories/category-form-dialog"
import { useCategories, useDeleteCategory } from "@/hooks/use-categories"
import type { CategoryRead } from "@/types/category"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories()
  const deleteMutation = useDeleteCategory()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryRead | null>(null)

  function handleCreate() {
    setEditingCategory(null)
    setIsDialogOpen(true)
  }

  function handleEdit(category: CategoryRead) {
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  function handleDelete(id: number, name: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Categoria excluída", { description: name })
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao excluir")
      },
    })
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>Erro ao carregar as categorias.</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Suas Categorias</h2>
          <p className="text-sm text-muted-foreground">
            Organize suas transações para gerar relatórios precisos.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Lista de Categorias */}
      {categories?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Tags className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma categoria</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Crie categorias como "Alimentação" ou "Transporte" para organizar seus gastos.
          </p>
          <Button onClick={handleCreate} variant="outline">Criar primeira categoria</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category) => (
            <Card key={category.id} className="group relative overflow-hidden">
              {/* Faixa colorida no topo do card */}
              <div 
                className="absolute top-0 left-0 w-full h-1.5" 
                style={{ backgroundColor: category.color }} 
              />
              <CardContent className="p-4 flex items-center justify-between mt-1">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A categoria <strong>"{category.name}"</strong> será excluída. 
                          As transações vinculadas a ela <strong>não serão apagadas</strong>, 
                          mas ficarão marcadas como "Sem categoria".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category.id, category.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <CategoryFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={editingCategory}
      />
    </div>
  )
}