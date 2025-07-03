"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import { MediaItemComponent } from "@/components/media-item"
import { useToast } from "@/components/ui/use-toast"

type MediaItem = {
  id: number
  title: string
  description: string
  category_id: string
  date: string
  created_at: string
  file_path?: string
}

// Função para formatar data no padrão brasileiro
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

export function FavoritesDisplay() {
  const { toast } = useToast()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = async () => {
    setLoading(true)
    setError(null)

    try {
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/favorites?_=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Falha ao buscar favoritos")
      }

      const data = await response.json()
      console.log("Dados de favoritos recebidos:", data)
      setItems(data)
    } catch (err) {
      console.error("Erro ao buscar favoritos:", err)
      setError("Falha ao carregar favoritos. Por favor, tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-muted-foreground">Carregando favoritos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold">Erro</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button className="mt-4" onClick={() => fetchFavorites()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Favoritos</h1>
          <p className="text-muted-foreground mt-1">Suas memórias favoritas reunidas em um só lugar</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="grid" className="w-[200px]" onValueChange={(v) => setView(v as "grid" | "list")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Grade</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={fetchFavorites}>
            Atualizar
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {items.map((item) => (
            <MediaItemComponent
              key={item.id}
              item={item}
              view={view}
              onFavoriteChange={() => {
                // Recarregar a lista após remover dos favoritos
                fetchFavorites()
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">Nenhum favorito ainda</h3>
          <p className="text-muted-foreground mt-2">
            Navegue pelas categorias e clique no botão de coração para adicionar memórias aos seus favoritos.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/">Explorar Categorias</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
