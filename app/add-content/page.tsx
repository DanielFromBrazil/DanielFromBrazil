"use client"

import type React from "react"
import Link from "next/link"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Heart, ArrowLeft, Upload, X, Loader2, Plus, Check, Music, ImageIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { addMemory } from "@/app/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { PasswordProtection } from "@/components/password-protection"
import { MusicSearch, type Track } from "@/components/music-search"
import { MusicPlayer } from "@/components/music-player"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

export default function AddContentPage() {
  return (
    <PasswordProtection returnPath="/">
      <AddContentForm />
    </PasswordProtection>
  )
}

function AddContentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [activeTab, setActiveTab] = useState<"files" | "music">("files")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      name: string
      path: string
      type: string
      size: number
      public_id?: string
    }[]
  >([])
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isMusicDialogOpen, setIsMusicDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    date: "",
  })

  // Atualizar o estado do formulário quando os campos mudarem
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Atualizar o estado da categoria quando mudar
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }))

    // Se a categoria for música, mudar para a aba de música
    if (value === "music") {
      setActiveTab("music")
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const formData = new FormData()

      // Adicionar todos os arquivos selecionados ao FormData
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i])
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Adicionar os novos arquivos aos já existentes
        setUploadedFiles((prev) => [...prev, ...result.files])

        toast({
          title: `${result.files.length} arquivo(s) enviado(s)`,
          description: "Seus arquivos foram enviados e serão anexados a esta memória.",
          variant: "default",
          icon: <Check className="h-4 w-4 text-green-500" />,
        })
      } else {
        throw new Error(result.error || "Falha ao enviar arquivos")
      }
    } catch (error) {
      console.error("Erro ao enviar arquivos:", error)
      toast({
        title: "Falha no envio",
        description: "Ocorreu um erro ao enviar seus arquivos. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Limpar o input de arquivo para permitir selecionar os mesmos arquivos novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Validar campos obrigatórios manualmente
      if (!formData.title || !formData.category || !formData.date) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validar que pelo menos um arquivo ou música foi selecionado
      if (activeTab === "files" && uploadedFiles.length === 0) {
        toast({
          title: "Nenhum arquivo selecionado",
          description: "Por favor, envie pelo menos um arquivo para esta memória.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (activeTab === "music" && !selectedTrack) {
        toast({
          title: "Nenhuma música selecionada",
          description: "Por favor, selecione uma música para esta memória.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Criar FormData manualmente
      const submitFormData = new FormData()
      submitFormData.append("title", formData.title)
      submitFormData.append("category", formData.category)
      submitFormData.append("description", formData.description)
      submitFormData.append("date", formData.date)
      submitFormData.append("contentType", activeTab)

      // Add file data if files were uploaded
      if (activeTab === "files" && uploadedFiles.length > 0) {
        submitFormData.append("fileData", JSON.stringify(uploadedFiles))
      }

      // Add track data if a track was selected
      if (activeTab === "music" && selectedTrack) {
        submitFormData.append("trackData", JSON.stringify(selectedTrack))
      }

      console.log("Enviando formulário com dados:", {
        title: formData.title,
        category: formData.category,
        date: formData.date,
        contentType: activeTab,
        hasFiles: uploadedFiles.length,
        hasTrack: !!selectedTrack,
      })

      const result = await addMemory(submitFormData)

      if (result.success) {
        toast({
          title: "Memória adicionada",
          description: `A memória "${formData.title}" foi salva com sucesso.`,
          variant: "default",
          icon: <Check className="h-4 w-4 text-green-500" />,
        })

        // Redirect to the category page
        router.push(`/category/${formData.category}`)
      } else {
        throw new Error(result.error || "Falha ao adicionar memória")
      }
    } catch (error) {
      console.error("Erro ao adicionar memória:", error)
      toast({
        title: "Falha ao adicionar memória",
        description: `Ocorreu um erro ao salvar sua memória: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remove uploaded file
  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index]
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))

    toast({
      title: "Arquivo removido",
      description: `O arquivo "${fileToRemove.name}" foi removido da lista.`,
      variant: "default",
    })
  }

  // Handle track selection
  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track)
    setIsMusicDialogOpen(false)

    toast({
      title: "Música selecionada",
      description: `A música "${track.name}" de ${track.artist} foi selecionada.`,
      variant: "default",
      icon: <Music className="h-4 w-4 text-green-500" />,
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
            <span className="text-xl font-semibold">Diário de Amor</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Início
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Adicionar Nova Memória</h1>
              <p className="text-muted-foreground mt-2">
                Compartilhe um novo momento, pensamento ou sentimento para expressar seu amor.
              </p>
            </div>

            <form
              ref={formRef}
              className="space-y-6"
              onSubmit={handleSubmit}
              onClick={(e) => {
                // Evitar que cliques em botões dentro do player de música submetam o formulário
                if ((e.target as HTMLElement).closest(".music-player-controls")) {
                  e.preventDefault()
                }
              }}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Dê um título para sua memória"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select name="category" required value={formData.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photos">Fotos</SelectItem>
                      <SelectItem value="videos">Vídeos</SelectItem>
                      <SelectItem value="letters">Cartas</SelectItem>
                      <SelectItem value="music">Músicas</SelectItem>
                      <SelectItem value="voice">Mensagens de Voz</SelectItem>
                      <SelectItem value="dates">Datas Especiais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Escreva sobre esta memória ou sentimento..."
                    className="min-h-[120px]"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "files" | "music")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="files" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Arquivos
                      </TabsTrigger>
                      <TabsTrigger value="music" className="flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        Música
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="mt-4">
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center">
                        <div className="w-full">
                          {uploadedFiles.length > 0 && (
                            <div className="mb-4 space-y-2">
                              <h4 className="text-sm font-medium">Arquivos enviados ({uploadedFiles.length})</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {uploadedFiles.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-muted p-3 rounded-md"
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <div className="flex-shrink-0 w-10 h-10 bg-background rounded-md flex items-center justify-center">
                                        {file.type.startsWith("image/") ? (
                                          <img
                                            src={file.path || "/placeholder.svg"}
                                            alt="Prévia"
                                            className="w-full h-full object-cover rounded-md"
                                          />
                                        ) : (
                                          <div className="text-xs font-medium">Arquivo</div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Arraste e solte seus arquivos aqui, ou clique para navegar
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Suporta imagens, vídeos, arquivos de áudio e documentos
                            </p>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                              className="hidden"
                              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                              multiple
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Arquivos
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="music" className="mt-4">
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-4">
                        {selectedTrack ? (
                          <div className="w-full space-y-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={selectedTrack.albumArt || "/placeholder.svg?height=80&width=80"}
                                alt={selectedTrack.album}
                                className="w-20 h-20 rounded-md object-cover"
                              />
                              <div className="flex-1">
                                <h3 className="font-medium">{selectedTrack.name}</h3>
                                <p className="text-sm text-muted-foreground">{selectedTrack.artist}</p>
                                <p className="text-sm text-muted-foreground">{selectedTrack.album}</p>
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTrack(null)}>
                                <X className="h-4 w-4 mr-2" />
                                Remover
                              </Button>
                            </div>

                            <div className="music-player-controls">
                              <MusicPlayer track={selectedTrack} />
                            </div>
                            {!selectedTrack.previewUrl && (
                              <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm">
                                <p className="font-medium">Nota: Esta música não possui prévia disponível.</p>
                                <p>
                                  Devido às limitações da API do Spotify, só é possível ouvir a música completa
                                  diretamente no Spotify. Um botão para abrir no Spotify será exibido na memória.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">
                              Nenhuma música selecionada. Clique no botão abaixo para pesquisar e adicionar uma música.
                            </p>
                            <Dialog open={isMusicDialogOpen} onOpenChange={setIsMusicDialogOpen}>
                              <DialogTrigger asChild>
                                <Button type="button">
                                  <Music className="h-4 w-4 mr-2" />
                                  Adicionar uma Música
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Pesquisar Música</DialogTitle>
                                  <DialogDescription>
                                    Pesquise por artista ou nome da música para adicionar à sua memória.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <MusicSearch onSelectTrack={handleTrackSelect} selectedTrack={selectedTrack} />
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                      Cancelar
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Memória"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-2 py-4 md:h-16 md:flex-row md:items-center md:py-0 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
            <span className="text-sm text-muted-foreground">Diário de Amor © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
