"use client"

import type React from "react"

import { useState } from "react"
import { Heart, Calendar, Music, Image, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MusicPlayer } from "@/components/music-player"
import type { Track } from "./music-search"

interface MediaItemProps {
  item: {
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
  view?: "grid" | "list"
  onFavoriteChange?: () => void
  isFavorite?: boolean
  onToggleFavorite?: (id: number) => void
}

export default function MediaItem({
  item,
  view = "grid",
  onFavoriteChange,
  isFavorite = false,
  onToggleFavorite,
}: MediaItemProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Função para formatar data no padrão brasileiro
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return "Data não disponível"
      }
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "Data não disponível"
    }
  }

  // Processar dados da faixa se existirem
  let trackData: Track | null = null
  try {
    if (item.track_data) {
      trackData = JSON.parse(item.track_data)
    }
  } catch (error) {
    console.error("Erro ao processar dados da música:", error)
  }

  // Determinar o tipo de mídia principal
  const files = item.files || []
  const mainFile = files.length > 0 ? files[currentImageIndex] : { file_path: item.file_path, file_type: "" }
  const isImage = mainFile?.file_type?.startsWith("image/") || mainFile?.file_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  const isVideo = mainFile?.file_type?.startsWith("video/") || mainFile?.file_path?.match(/\.(mp4|webm|ogg|mov)$/i)
  const isAudio = mainFile?.file_type?.startsWith("audio/") || mainFile?.file_path?.match(/\.(mp3|wav|ogg)$/i)
  const isPDF = mainFile?.file_type === "application/pdf" || mainFile?.file_path?.match(/\.pdf$/i)

  // Truncar descrição se for muito longa
  const shortDescription =
    item.description && item.description.length > 150 ? `${item.description.slice(0, 150)}...` : item.description

  // Navegar entre as imagens
  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (files.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % files.length)
    }
  }

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (files.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + files.length) % files.length)
    }
  }

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(item.id)
    }
  }

  // Abrir no Spotify
  const openInSpotify = () => {
    if (trackData) {
      window.open(`https://open.spotify.com/track/${trackData.id}`, "_blank")
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video">
        {trackData ? (
          <div className="w-full h-full bg-muted flex items-center justify-center p-4">
            <img
              src={trackData.albumArt || "/placeholder.svg?height=200&width=200"}
              alt={trackData.album}
              className="h-full max-h-[200px] object-contain rounded-md"
            />
          </div>
        ) : isImage && mainFile?.file_path ? (
          <div className="relative h-full">
            <img
              src={mainFile.file_path || "/placeholder.svg"}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=200&width=200"
              }}
            />
            {files.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full"
                  onClick={prevImage}
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full"
                  onClick={nextImage}
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        ) : isVideo && mainFile?.file_path ? (
          <video src={mainFile.file_path} className="w-full h-full object-cover" controls />
        ) : isAudio && mainFile?.file_path ? (
          <div className="w-full h-full bg-muted flex items-center justify-center p-4">
            <audio src={mainFile.file_path} controls className="w-full" />
          </div>
        ) : (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
            {item.category_id === "music" ? (
              <Music className="h-16 w-16 text-muted-foreground opacity-50" />
            ) : (
              <Image className="h-16 w-16 text-muted-foreground opacity-50" />
            )}
            <p className="mt-2 text-muted-foreground text-sm">
              {item.category_id === "music" ? "Música" : "Visualização não disponível"}
            </p>
          </div>
        )}

        {files.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {files.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-primary" : "bg-primary/30"}`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Ver imagem ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          {onToggleFavorite && (
            <button
              onClick={handleToggleFavorite}
              className="text-rose-500"
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex-grow">
        {item.description && (
          <div className="mb-3">
            <p className="text-gray-600 text-sm">{showFullDescription ? item.description : shortDescription}</p>
            {item.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-primary mt-1"
              >
                {showFullDescription ? "Ver menos" : "Ver mais"}
              </button>
            )}
          </div>
        )}

        {trackData && (
          <div className="text-sm text-muted-foreground mt-2">
            <p>{trackData.artist}</p>
            <p>{trackData.album}</p>
            {!trackData.previewUrl && (
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={openInSpotify}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Ouvir no Spotify
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{formatDate(item.date)}</span>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Ver Detalhes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{item.title}</DialogTitle>
              <DialogDescription>{formatDate(item.date)}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4 overflow-y-auto flex-grow">
              {trackData ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <img
                      src={trackData.albumArt || "/placeholder.svg?height=200&width=200"}
                      alt={trackData.album}
                      className="w-40 h-40 object-cover rounded-md shadow-md"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{trackData.name}</h3>
                      <p className="text-muted-foreground">{trackData.artist}</p>
                      <p className="text-muted-foreground">{trackData.album}</p>
                      <div className="mt-4 max-h-[200px] overflow-y-auto pr-2">
                        <p>{item.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <MusicPlayer track={trackData} />
                  </div>
                </div>
              ) : isImage && files.length > 0 ? (
                <div className="relative">
                  <img
                    src={files[currentImageIndex].file_path || "/placeholder.svg"}
                    alt={item.title}
                    className="max-h-[50vh] mx-auto object-contain rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=400&width=600"
                    }}
                  />
                  {files.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                        onClick={prevImage}
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                        onClick={nextImage}
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="mt-2 text-center">
                        {currentImageIndex + 1} de {files.length}
                      </div>
                    </>
                  )}
                  <div className="mt-4 max-h-[200px] overflow-y-auto pr-2">
                    <p>{item.description}</p>
                  </div>
                </div>
              ) : isVideo && mainFile?.file_path ? (
                <div>
                  <video src={mainFile.file_path} className="max-h-[50vh] w-full" controls />
                  <div className="mt-4 max-h-[200px] overflow-y-auto pr-2">
                    <p>{item.description}</p>
                  </div>
                </div>
              ) : isAudio && mainFile?.file_path ? (
                <div>
                  <audio src={mainFile.file_path} controls className="w-full" />
                  <div className="mt-4 max-h-[200px] overflow-y-auto pr-2">
                    <p>{item.description}</p>
                  </div>
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto pr-2">
                  <p>{item.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

// Exportar como componente nomeado para compatibilidade
export const MediaItemComponent = MediaItem
