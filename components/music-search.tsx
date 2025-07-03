"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Disc, Music, AlertCircle, Loader2, Volume2, VolumeX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export type Track = {
  id: string
  name: string
  artist: string
  album: string
  albumArt: string
  previewUrl: string | null
  duration: number
}

interface MusicSearchProps {
  onSelectTrack: (track: Track) => void
  selectedTrack: Track | null
}

export function MusicSearch({ onSelectTrack, selectedTrack }: MusicSearchProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Função para testar a conexão com a API do Spotify
  const testSpotifyConnection = async () => {
    setIsSearching(true)
    setError(null)
    setDebugInfo("Testando conexão com a API do Spotify...")

    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/music/test?_=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setDebugInfo(`Conexão com a API do Spotify OK: ${data.message || "Teste bem-sucedido"}`)
      } else {
        setDebugInfo(`Erro na conexão com a API do Spotify: ${data.error || response.statusText}`)
      }
    } catch (err) {
      setDebugInfo(`Erro ao testar conexão: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    // Testar a conexão quando o componente montar
    testSpotifyConnection()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setDebugInfo(null)

    try {
      console.log("Iniciando pesquisa por:", searchQuery)
      setDebugInfo(`Pesquisando por: ${searchQuery}...`)

      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}&_=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      console.log("Status da resposta:", response.status)
      setDebugInfo(`Status da resposta: ${response.status}`)

      const data = await response.json()

      if (!response.ok) {
        console.error("Erro na resposta:", data)
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`)
      }

      console.log("Resultados encontrados:", data.tracks?.length || 0)

      if (!data.tracks) {
        throw new Error("Formato de resposta inválido")
      }

      // Contar quantas músicas têm prévia disponível
      const tracksWithPreview = data.tracks.filter((track: Track) => track.previewUrl).length
      setDebugInfo(`Resultados encontrados: ${data.tracks.length} (${tracksWithPreview} com prévia disponível)`)

      setSearchResults(data.tracks)

      if (data.tracks.length === 0) {
        setError(`Nenhuma música encontrada para "${searchQuery}". Tente outra pesquisa.`)
      }
    } catch (err) {
      console.error("Erro na pesquisa de músicas:", err)
      setError(err instanceof Error ? err.message : "Erro ao pesquisar músicas. Tente novamente.")
      setSearchResults([])

      toast({
        title: "Erro na pesquisa",
        description: err instanceof Error ? err.message : "Erro ao pesquisar músicas. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Pesquisar música ou artista..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {debugInfo && (
        <div className="p-2 text-xs bg-muted rounded-md">
          <p className="font-mono">{debugInfo}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-amber-50 text-amber-800 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Resultados da pesquisa</h3>
            <Badge variant="outline" className="text-xs">
              {searchResults.filter((track) => track.previewUrl).length} com prévia
            </Badge>
          </div>
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
            {searchResults.map((track) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                  selectedTrack?.id === track.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted hover:bg-muted/80"
                }`}
                onClick={() => onSelectTrack(track)}
              >
                {track.albumArt ? (
                  <img
                    src={track.albumArt || "/placeholder.svg"}
                    alt={`Capa do álbum ${track.album}`}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-muted-foreground/20 flex items-center justify-center">
                    <Disc className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{track.name}</p>
                    {track.previewUrl ? (
                      <Volume2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <VolumeX className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                </div>
                {selectedTrack?.id === track.id && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults.length === 0 && searchQuery && !isSearching && !error && (
        <div className="p-4 text-center text-muted-foreground bg-muted rounded-md">
          <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma música encontrada para "{searchQuery}"</p>
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        <p>
          Dica: Nem todas as músicas do Spotify têm prévia disponível. Músicas com o ícone{" "}
          <Volume2 className="h-3 w-3 text-green-500 inline" /> têm prévia disponível.
        </p>
        <p className="mt-1">Tente pesquisar por artistas populares como "Coldplay", "Ed Sheeran" ou "Taylor Swift".</p>
      </div>

      <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
        <h4 className="font-medium mb-1">Sobre a reprodução de músicas:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            O Spotify só permite reproduzir <strong>prévias de 30 segundos</strong> sem login
          </li>
          <li>Algumas músicas não possuem prévia disponível</li>
          <li>Para ouvir músicas completas, você será redirecionado para o Spotify</li>
          <li>
            Músicas com o ícone <Volume2 className="h-3 w-3 text-green-500 inline" /> têm prévia disponível
          </li>
        </ul>
      </div>
    </div>
  )
}
