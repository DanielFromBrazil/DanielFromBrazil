"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Heart, ChevronLeft, ChevronRight, Check, Image, Music } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MusicPlayer } from "@/components/music-player"

type FileItem = {
  id: number
  media_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  created_at: string
  public_id?: string
}

type MediaItem = {
  id: number
  title: string
  description: string
  category_id: string
  date: string
  created_at: string
  file_path?: string
  files?: FileItem[]
  track_data?: string
}

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

interface MediaItemProps {
  item: MediaItem
  view: "grid" | "list"
  onFavoriteChange?: () => void
}

export function MediaItemComponent({ item, view, onFavoriteChange }: MediaItemProps) {
  const { toast } = useToast()
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Verificar se o item tem arquivos
  const hasFiles = item.files && item.files.length > 0
  const hasMultipleFiles = item.files && item.files.length > 1

  // Verificar se o item tem dados de música
  const trackData = item.track_data ? JSON.parse(item.track_data) : null

  // Filtrar arquivos por tipo
  const imageFiles = item.files?.filter((file) => file.file_type.startsWith("image/")) || []
  const videoFiles = item.files?.filter((file) => file.file_type.startsWith("video/")) || []
  const audioFiles = item.files?.filter((file) => file.file_type.startsWith("audio/")) || []
  const documentFiles =
    item.files?.filter(
      (file) => file.file_type.includes("pdf") || file.file_type.includes("doc") || file.file_type.includes("text"),
    ) || []

  // Verificar se o item é favorito ao montar o componente
  useEffect(() => {
    async function checkFavorite() {
      try {
        const response = await fetch(`/api/favorites?mediaId=${item.id}`)
        if (response.ok) {
          const data = await response.json()
          setIsFavorite(data.isFavorite)
        }
      } catch (error) {
        console.error("Erro ao verificar favorito:", error)
      }
    }

    checkFavorite()
  }, [item.id])

  const toggleFavorite = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mediaId: item.id }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Resposta do toggle favorito:", data)
        setIsFavorite(data.isFavorite)

        toast({
          title: data.isFavorite ? "Adicionado aos favoritos" : "Removido dos favoritos",
          description: data.isFavorite
            ? `A memória "${item.title}" foi adicionada aos seus favoritos.`
            : `A memória "${item.title}" foi removida dos seus favoritos.`,
          variant: "default",
          icon: <Check className="h-4 w-4 text-green-500" />,
        })

        // Se o callback for fornecido, chama-o para atualizar a lista
        if (onFavoriteChange) {
          onFavoriteChange()
        }
      }
    } catch (error) {
      console.error("Erro ao alternar favorito:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar os favoritos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const nextImage = () => {
    if (imageFiles.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % imageFiles.length)
    }
  }

  const prevImage = () => {
    if (imageFiles.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length)
    }
  }

  // Obter o arquivo de imagem atual para exibição
  const currentImage = imageFiles[currentImageIndex]
  const mainImagePath = currentImage?.file_path || item.file_path || "/placeholder.svg"

  // Placeholder para quando não há imagens
  const renderPlaceholder = () => (
    <div className="bg-muted h-full w-full flex flex-col items-center justify-center">
      {item.category_id === "music" || trackData ? (
        <Music className="h-8 w-8 text-muted-foreground mb-2" />
      ) : (
        <Image className="h-8 w-8 text-muted-foreground mb-2" />
      )}
      <span className="text-sm text-muted-foreground">{item.category_id}</span>
      <span className="text-xs text-muted-foreground mt-1">ID: {item.id}</span>
    </div>
  )

  return (
    <Card className={view === "list" ? "flex flex-row overflow-hidden" : ""}>
      {view === "list" ? (
        <>
          <div className="relative w-1/3 min-w-[120px]">
            {trackData ? (
              <div className="h-full flex items-center justify-center bg-muted p-2">
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={trackData.albumArt || "/placeholder.svg?height=120&width=120"}
                    alt={trackData.album}
                    className="object-cover max-h-full max-w-full rounded-md"
                  />
                </div>
              </div>
            ) : imageFiles.length > 0 ? (
              <div className="relative h-full">
                <img
                  src={mainImagePath || "/placeholder.svg"}
                  alt={item.title}
                  className="object-cover h-full w-full"
                  onError={(e) => {
                    console.error(`Erro ao carregar imagem: ${mainImagePath}`)
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                {hasMultipleFiles && imageFiles.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/30 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/30 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {hasMultipleFiles && (
                  <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {currentImageIndex + 1}/{imageFiles.length}
                  </div>
                )}
              </div>
            ) : (
              renderPlaceholder()
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>
                    {formatDate(item.date)} • {item.category_id} • ID: {item.id}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>{item.description}</p>
              {hasMultipleFiles && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{item.files?.length} arquivos anexados</p>
                </div>
              )}
              {trackData && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    {trackData.artist} - {trackData.album}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between mt-auto">
              <Button variant="ghost" size="sm" onClick={toggleFavorite} disabled={isLoading}>
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                {isFavorite ? "Favorito" : "Favoritar"}
              </Button>

              {(hasFiles || trackData) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{item.title}</DialogTitle>
                      <DialogDescription>
                        {formatDate(item.date)} • ID: {item.id}
                      </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue={trackData ? "music" : "images"} className="mt-4">
                      <TabsList className="grid grid-cols-5 mb-4">
                        {trackData && <TabsTrigger value="music">Música</TabsTrigger>}
                        {imageFiles.length > 0 && (
                          <TabsTrigger value="images">Imagens ({imageFiles.length})</TabsTrigger>
                        )}
                        {videoFiles.length > 0 && (
                          <TabsTrigger value="videos">Vídeos ({videoFiles.length})</TabsTrigger>
                        )}
                        {audioFiles.length > 0 && <TabsTrigger value="audio">Áudio ({audioFiles.length})</TabsTrigger>}
                        {documentFiles.length > 0 && (
                          <TabsTrigger value="docs">Documentos ({documentFiles.length})</TabsTrigger>
                        )}
                      </TabsList>

                      {trackData && (
                        <TabsContent value="music">
                          <div className="p-4 bg-muted rounded-lg">
                            <MusicPlayer track={trackData} />
                          </div>
                        </TabsContent>
                      )}

                      {imageFiles.length > 0 && (
                        <TabsContent value="images">
                          <div className="relative">
                            <img
                              src={imageFiles[currentImageIndex].file_path || "/placeholder.svg"}
                              alt={item.title}
                              className="max-h-[70vh] w-auto mx-auto object-contain"
                              onError={(e) => {
                                console.error(`Erro ao carregar imagem: ${imageFiles[currentImageIndex].file_path}`)
                                e.currentTarget.src = "/placeholder.svg"
                              }}
                            />
                            {imageFiles.length > 1 && (
                              <div className="absolute inset-0 flex items-center justify-between">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-full bg-black/30 text-white"
                                  onClick={prevImage}
                                >
                                  <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-full bg-black/30 text-white"
                                  onClick={nextImage}
                                >
                                  <ChevronRight className="h-6 w-6" />
                                </Button>
                              </div>
                            )}
                            {imageFiles.length > 1 && (
                              <div className="mt-2 text-center">
                                {currentImageIndex + 1} de {imageFiles.length}
                              </div>
                            )}
                          </div>

                          {imageFiles.length > 1 && (
                            <div className="grid grid-cols-6 gap-2 mt-4">
                              {imageFiles.map((file, index) => (
                                <div
                                  key={file.id}
                                  className={`cursor-pointer border-2 rounded overflow-hidden ${index === currentImageIndex ? "border-primary" : "border-transparent"}`}
                                  onClick={() => setCurrentImageIndex(index)}
                                >
                                  <img
                                    src={file.file_path || "/placeholder.svg"}
                                    alt={`Miniatura ${index + 1}`}
                                    className="w-full h-16 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg"
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      )}

                      {videoFiles.length > 0 && (
                        <TabsContent value="videos">
                          <div className="space-y-4">
                            {videoFiles.map((file) => (
                              <div key={file.id}>
                                <video src={file.file_path} controls className="w-full max-h-[70vh]">
                                  Seu navegador não suporta a reprodução de vídeos.
                                </video>
                                <p className="text-sm mt-1">{file.file_name}</p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      )}

                      {audioFiles.length > 0 && (
                        <TabsContent value="audio">
                          <div className="space-y-4">
                            {audioFiles.map((file) => (
                              <div key={file.id} className="bg-muted p-4 rounded">
                                <p className="text-sm mb-2">{file.file_name}</p>
                                <audio src={file.file_path} controls className="w-full">
                                  Seu navegador não suporta a reprodução de áudio.
                                </audio>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      )}

                      {documentFiles.length > 0 && (
                        <TabsContent value="docs">
                          <div className="space-y-2">
                            {documentFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between bg-muted p-3 rounded">
                                <span>{file.file_name}</span>
                                <Button asChild size="sm">
                                  <a href={file.file_path} target="_blank" rel="noopener noreferrer">
                                    Abrir
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </div>
        </>
      ) : (
        <>
          {trackData ? (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={trackData.albumArt || "/placeholder.svg?height=48&width=48"}
                    alt={trackData.album}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{trackData.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{trackData.artist}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : imageFiles.length > 0 ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
              <img
                src={mainImagePath || "/placeholder.svg"}
                alt={item.title}
                className="object-cover w-full h-full"
                onError={(e) => {
                  console.error(`Erro ao carregar imagem: ${mainImagePath}`)
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
              {hasMultipleFiles && imageFiles.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/30 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/30 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {hasMultipleFiles && (
                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1}/{imageFiles.length}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted flex flex-col items-center justify-center">
              {item.category_id === "music" ? (
                <Music className="h-8 w-8 text-muted-foreground mb-2" />
              ) : (
                <Image className="h-8 w-8 text-muted-foreground mb-2" />
              )}
              <span className="text-muted-foreground">{item.category_id}</span>
              <span className="text-xs text-muted-foreground mt-1">ID: {item.id}</span>
            </div>
          )}
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>
              {formatDate(item.date)} • ID: {item.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{item.description}</p>
            {hasMultipleFiles && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">{item.files?.length} arquivos anexados</p>
              </div>
            )}
            {trackData && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {trackData.artist} - {trackData.album}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={toggleFavorite} disabled={isLoading}>
              <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
              {isFavorite ? "Favorito" : "Favoritar"}
            </Button>

            {(hasFiles || trackData) && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{item.title}</DialogTitle>
                    <DialogDescription>
                      {formatDate(item.date)} • ID: {item.id}
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue={trackData ? "music" : "images"} className="mt-4">
                    <TabsList className="grid grid-cols-5 mb-4">
                      {trackData && <TabsTrigger value="music">Música</TabsTrigger>}
                      {imageFiles.length > 0 && <TabsTrigger value="images">Imagens ({imageFiles.length})</TabsTrigger>}
                      {videoFiles.length > 0 && <TabsTrigger value="videos">Vídeos ({videoFiles.length})</TabsTrigger>}
                      {audioFiles.length > 0 && <TabsTrigger value="audio">Áudio ({audioFiles.length})</TabsTrigger>}
                      {documentFiles.length > 0 && (
                        <TabsTrigger value="docs">Documentos ({documentFiles.length})</TabsTrigger>
                      )}
                    </TabsList>

                    {trackData && (
                      <TabsContent value="music">
                        <div className="p-4 bg-muted rounded-lg">
                          <MusicPlayer track={trackData} />
                        </div>
                      </TabsContent>
                    )}

                    {imageFiles.length > 0 && (
                      <TabsContent value="images">
                        <div className="relative">
                          <img
                            src={imageFiles[currentImageIndex].file_path || "/placeholder.svg"}
                            alt={item.title}
                            className="max-h-[70vh] w-auto mx-auto object-contain"
                            onError={(e) => {
                              console.error(`Erro ao carregar imagem: ${imageFiles[currentImageIndex].file_path}`)
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                          {imageFiles.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-between">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-black/30 text-white"
                                onClick={prevImage}
                              >
                                <ChevronLeft className="h-6 w-6" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-black/30 text-white"
                                onClick={nextImage}
                              >
                                <ChevronRight className="h-6 w-6" />
                              </Button>
                            </div>
                          )}
                          {imageFiles.length > 1 && (
                            <div className="mt-2 text-center">
                              {currentImageIndex + 1} de {imageFiles.length}
                            </div>
                          )}
                        </div>

                        {imageFiles.length > 1 && (
                          <div className="grid grid-cols-6 gap-2 mt-4">
                            {imageFiles.map((file, index) => (
                              <div
                                key={file.id}
                                className={`cursor-pointer border-2 rounded overflow-hidden ${index === currentImageIndex ? "border-primary" : "border-transparent"}`}
                                onClick={() => setCurrentImageIndex(index)}
                              >
                                <img
                                  src={file.file_path || "/placeholder.svg"}
                                  alt={`Miniatura ${index + 1}`}
                                  className="w-full h-16 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg"
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    )}

                    {videoFiles.length > 0 && (
                      <TabsContent value="videos">
                        <div className="space-y-4">
                          {videoFiles.map((file) => (
                            <div key={file.id}>
                              <video src={file.file_path} controls className="w-full max-h-[70vh]">
                                Seu navegador não suporta a reprodução de vídeos.
                              </video>
                              <p className="text-sm mt-1">{file.file_name}</p>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {audioFiles.length > 0 && (
                      <TabsContent value="audio">
                        <div className="space-y-4">
                          {audioFiles.map((file) => (
                            <div key={file.id} className="bg-muted p-4 rounded">
                              <p className="text-sm mb-2">{file.file_name}</p>
                              <audio src={file.file_path} controls className="w-full">
                                Seu navegador não suporta a reprodução de áudio.
                              </audio>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {documentFiles.length > 0 && (
                      <TabsContent value="docs">
                        <div className="space-y-2">
                          {documentFiles.map((file) => (
                            <div key={file.id} className="flex items-center justify-between bg-muted p-3 rounded">
                              <span>{file.file_name}</span>
                              <Button asChild size="sm">
                                <a href={file.file_path} target="_blank" rel="noopener noreferrer">
                                  Abrir
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

// Exportar como componente nomeado para compatibilidade
export default MediaItemComponent
