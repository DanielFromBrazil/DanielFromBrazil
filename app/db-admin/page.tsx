"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Database, Trash2, Eye, Download } from "lucide-react"
import Link from "next/link"
import { PasswordProtection } from "@/components/password-protection"

interface MediaItem {
  id: number
  title: string
  description: string
  category_id: string
  date: string
  created_at: string
  files?: FileItem[]
}

interface FileItem {
  id: number
  media_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  public_id?: string
  created_at: string
}

interface Category {
  id: string
  name: string
  description: string
}

interface Favorite {
  id: number
  media_id: number
  created_at: string
}

export default function DbAdminPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("media")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar dados das diferentes tabelas
      const [mediaRes, categoriesRes, favoritesRes, filesRes] = await Promise.all([
        fetch("/api/db-admin/media"),
        fetch("/api/db-admin/categories"),
        fetch("/api/db-admin/favorites"),
        fetch("/api/db-admin/files"),
      ])

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json()
        setMediaItems(mediaData)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json()
        setFavorites(favoritesData)
      }

      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setFiles(filesData)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMedia = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta memória?")) return

    try {
      const response = await fetch(`/api/db-admin/media/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadData()
        alert("Memória excluída com sucesso!")
      } else {
        alert("Erro ao excluir memória")
      }
    } catch (error) {
      console.error("Erro ao excluir memória:", error)
      alert("Erro ao excluir memória")
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch("/api/db-admin/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `backup-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      alert("Erro ao exportar dados")
    }
  }

  if (loading) {
    return (
      <PasswordProtection returnPath="/">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Database className="h-12 w-12 animate-pulse mx-auto mb-4" />
            <p>Carregando dados do banco...</p>
          </div>
        </div>
      </PasswordProtection>
    )
  }

  return (
    <PasswordProtection returnPath="/">
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Administração do Banco de Dados</span>
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Voltar</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Administração do Banco de Dados</h1>
            <p className="text-muted-foreground">Visualize e gerencie os dados armazenados no SQLite</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="media">Memórias ({mediaItems.length})</TabsTrigger>
              <TabsTrigger value="files">Arquivos ({files.length})</TabsTrigger>
              <TabsTrigger value="favorites">Favoritos ({favorites.length})</TabsTrigger>
              <TabsTrigger value="categories">Categorias ({categories.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Memórias</CardTitle>
                  <CardDescription>Todas as memórias armazenadas no banco de dados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mediaItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.category_id}</Badge>
                            </TableCell>
                            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/category/${item.category_id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteMedia(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos</CardTitle>
                  <CardDescription>Todos os arquivos associados às memórias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nome do Arquivo</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead>Memória ID</TableHead>
                          <TableHead>Public ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {files.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell>{file.id}</TableCell>
                            <TableCell className="font-medium">{file.file_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{file.file_type}</Badge>
                            </TableCell>
                            <TableCell>{(file.file_size / 1024 / 1024).toFixed(2)} MB</TableCell>
                            <TableCell>{file.media_id}</TableCell>
                            <TableCell className="font-mono text-xs">{file.public_id || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Favoritos</CardTitle>
                  <CardDescription>Memórias marcadas como favoritas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Memória ID</TableHead>
                          <TableHead>Título da Memória</TableHead>
                          <TableHead>Favoritado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {favorites.map((favorite) => {
                          const media = mediaItems.find((m) => m.id === favorite.media_id)
                          return (
                            <TableRow key={favorite.id}>
                              <TableCell>{favorite.id}</TableCell>
                              <TableCell>{favorite.media_id}</TableCell>
                              <TableCell className="font-medium">{media?.title || "Memória não encontrada"}</TableCell>
                              <TableCell>{new Date(favorite.created_at).toLocaleString()}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>Categorias disponíveis no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Qtd. Memórias</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category) => {
                          const count = mediaItems.filter((m) => m.category_id === category.id).length
                          return (
                            <TableRow key={category.id}>
                              <TableCell className="font-mono">{category.id}</TableCell>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell>{category.description}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{count}</Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PasswordProtection>
  )
}
