"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2, AlertTriangle, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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

type MediaItem = {
  id: number
  title: string
  description: string
  category_id: string
  date: string
  created_at: string
  file_path?: string
}

const categoryTitles: Record<string, string> = {
  photos: "Fotos",
  videos: "Vídeos",
  letters: "Cartas",
  music: "Músicas",
  voice: "Mensagens de Voz",
  dates: "Datas Especiais",
  favorites: "Favoritos",
}

// Função para formatar data no padrão brasileiro
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

export function MemoryManager() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)

  const fetchMemories = async (category?: string) => {
    setLoading(true)
    setError(null)

    try {
      let url = "/api/memories"
      if (category && category !== "all") {
        url += `?categoryId=${category}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Falha ao buscar memórias")
      }

      const data = await response.json()
      setItems(data)
    } catch (err) {
      console.error("Erro ao buscar memórias:", err)
      setError("Falha ao carregar memórias. Por favor, tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories(selectedCategory === "all" ? undefined : selectedCategory)
  }, [selectedCategory])

  const handleDelete = async (id: number, title: string) => {
    setDeleteLoading(id)
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Falha ao excluir memória")
      }

      // Remover o item da lista
      setItems(items.filter((item) => item.id !== id))

      toast({
        title: "Memória excluída",
        description: `A memória "${title}" foi excluída com sucesso.`,
        variant: "default",
        icon: <Check className="h-4 w-4 text-green-500" />,
      })
    } catch (err) {
      console.error("Erro ao excluir memória:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a memória. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-muted-foreground">Carregando memórias...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold">Erro</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button
          className="mt-4"
          onClick={() => fetchMemories(selectedCategory === "all" ? undefined : selectedCategory)}
        >
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Memórias</h1>
        <p className="text-muted-foreground mt-1">Remova memórias que não deseja mais manter</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-full md:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(categoryTitles).map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col md:flex-row overflow-hidden">
              {item.file_path && item.category_id === "photos" && (
                <div className="relative w-full md:w-1/4 h-48 md:h-auto">
                  <img
                    src={item.file_path || "/placeholder.svg"}
                    alt={item.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>
                        {formatDate(item.date)} • {categoryTitles[item.category_id] || item.category_id}
                      </CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          {deleteLoading === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a memória "{item.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id, item.title)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{item.description}</p>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">Nenhuma memória encontrada</h3>
          <p className="text-muted-foreground mt-2">
            {selectedCategory === "all"
              ? "Não há memórias para gerenciar."
              : `Não há memórias na categoria ${categoryTitles[selectedCategory] || selectedCategory}.`}
          </p>
        </div>
      )}
    </div>
  )
}
