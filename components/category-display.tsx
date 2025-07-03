"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Loader2 } from "lucide-react"
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
  files?: Array<{ file_path: string; file_type: string; file_name: string }>
  track_data?: string
}

const categoryTitles = {
  photos: "Galeria de Fotos",
  videos: "Memórias em Vídeo",
  letters: "Cartas de Amor",
  music: "Nossa Trilha Sonora",
  voice: "Mensagens de Voz",
  dates: "Datas Especiais",
}

export function CategoryDisplay({ categoryId }: { categoryId: string }) {
  const { toast } = useToast()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})

  const fetchMediaItems = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Buscando itens de mídia para categoria:", categoryId)

      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/media?categoryId=${categoryId}&_=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Falha ao buscar itens de mídia: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`Encontrados ${data.length} itens para a categoria ${categoryId}`)

      // Log para depuração
      if (data.length > 0) {
        console.log("Exemplo do primeiro item:", {
          id: data[0].id,
          title: data[0].title,
          date: data[0].date,
          hasFiles: data[0].files?.length || 0,
          hasTrackData: !!data[0].track_data,
        })
      }

      setItems(data)

      // Buscar status de favoritos para cada item
      const favoritesMap: Record<number, boolean> = {}
      for (const item of data) {
        try {
          const favResponse = await fetch(`/api/favorites?mediaId=${item.id}`)
          if (favResponse.ok) {
            const favData = await favResponse.json()
            favoritesMap[item.id] = favData.isFavorite
          }
        } catch (err) {
          console.error(`Erro ao verificar favorito para item ${item.id}:`, err)
        }
      }
      setFavorites(favoritesMap)
    } catch (err) {
      console.error("Erro ao buscar itens de mídia:", err)
      setError("Falha ao carregar itens de mídia. Por favor, tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMediaItems()
  }, [categoryId])

  const handleToggleFavorite = async (mediaId: number) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mediaId }),
      })

      if (response.ok) {
        const data = await response.json()
        setFavorites((prev) => ({
          ...prev,
          [mediaId]: data.isFavorite,
        }))

        toast({
          title: data.isFavorite ? "Adicionado aos favoritos" : "Removido dos favoritos",
          description: data.isFavorite ? "Item adicionado aos seus favoritos." : "Item removido dos seus favoritos.",
        })
      }
    } catch (error) {
      console.error("Erro ao alternar favorito:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar os favoritos.",
        variant: "destructive",
      })
    }
  }

  const title = categoryTitles[categoryId as keyof typeof categoryTitles] || "Memórias"

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
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">Explore seus momentos especiais</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="grid" className="w-[200px]" onValueChange={(v) => setView(v as "grid" | "list")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Grade</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" asChild>
            <Link href="/add-content">Adicionar Novo</Link>
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
                // Recarregar a lista após mudança nos favoritos
                fetchMediaItems()
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">Nenhuma memória ainda</h3>
          <p className="text-muted-foreground mt-2">Comece a adicionar seus momentos especiais a esta categoria.</p>
          <Button className="mt-4" asChild>
            <Link href="/add-content">Adicionar Sua Primeira Memória</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
