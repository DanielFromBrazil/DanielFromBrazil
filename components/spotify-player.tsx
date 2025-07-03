"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { getAccessToken, isLoggedIn, loginWithSpotify } from "@/lib/spotify-auth"
import type { Track } from "./music-search"

// Adicionar a definição do tipo para o SDK do Spotify
declare global {
  interface Window {
    Spotify: {
      Player: new (options: any) => any
    }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

interface SpotifyPlayerProps {
  track: Track
}

export function SpotifyPlayer({ track }: SpotifyPlayerProps) {
  const [player, setPlayer] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  // Verificar se o usuário está logado no Spotify
  const isAuthenticated = isLoggedIn()

  // Carregar o SDK do Spotify
  useEffect(() => {
    if (!isAuthenticated) return

    // Função para carregar o script do SDK
    const loadSpotifySDK = () => {
      const script = document.createElement("script")
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true
      document.body.appendChild(script)

      window.onSpotifyWebPlaybackSDKReady = () => {
        initializePlayer()
      }
    }

    // Inicializar o player
    const initializePlayer = () => {
      const token = getAccessToken()
      if (!token) return

      const newPlayer = new window.Spotify.Player({
        name: "Diário de Amor Web Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token)
        },
        volume: volume,
      })

      // Eventos do player
      newPlayer.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Ready with Device ID", device_id)
        setDeviceId(device_id)
        setIsReady(true)
      })

      newPlayer.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("Device ID has gone offline", device_id)
        setIsReady(false)
      })

      newPlayer.addListener("player_state_changed", (state: any) => {
        if (!state) return

        setIsPlaying(!state.paused)
      })

      newPlayer.addListener("initialization_error", ({ message }: { message: string }) => {
        console.error("Failed to initialize", message)
        setError(`Erro ao inicializar player: ${message}`)
      })

      newPlayer.addListener("authentication_error", ({ message }: { message: string }) => {
        console.error("Failed to authenticate", message)
        setError(`Erro de autenticação: ${message}`)
      })

      newPlayer.addListener("account_error", ({ message }: { message: string }) => {
        console.error("Failed to validate account", message)
        setError(`Erro de conta: ${message}. Você precisa ter uma conta Spotify Premium.`)
      })

      newPlayer.connect()
      setPlayer(newPlayer)
    }

    // Verificar se o SDK já está carregado
    if (!window.Spotify) {
      loadSpotifySDK()
    } else {
      initializePlayer()
    }

    // Limpar ao desmontar
    return () => {
      if (player) {
        player.disconnect()
      }
    }
  }, [isAuthenticated, volume])

  // Função para reproduzir a música
  const playTrack = async () => {
    if (!player || !deviceId || !isReady) return

    setIsLoading(true)

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [`spotify:track:${track.id}`],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Erro ao reproduzir música")
      }

      setIsPlaying(true)
    } catch (err) {
      console.error("Erro ao reproduzir:", err)
      setError(`Erro ao reproduzir: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para pausar a música
  const pauseTrack = () => {
    if (!player) return
    player.pause()
    setIsPlaying(false)
  }

  // Função para alternar entre play e pause
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      playTrack()
    }
  }

  // Função para ajustar o volume
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)

    if (player) {
      player.setVolume(newVolume)
    }
  }

  // Função para alternar mudo
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume(0.5)
      if (player) player.setVolume(0.5)
    } else {
      setIsMuted(true)
      setVolume(0)
      if (player) player.setVolume(0)
    }
  }

  // Função para iniciar o login com o Spotify
  const handleLogin = () => {
    loginWithSpotify(track.id)
  }

  // Se o usuário não estiver autenticado, mostrar botão de login
  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <img
            src={track.albumArt || "/placeholder.svg?height=120&width=120"}
            alt={track.album}
            className="w-28 h-28 rounded-md object-cover shadow-md"
          />
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-bold text-lg">{track.name}</h3>
            <p className="text-gray-600">{track.artist}</p>
            <p className="text-gray-600 text-sm">{track.album}</p>

            <Button className="mt-4 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white" onClick={handleLogin}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Entrar com Spotify para ouvir
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              É necessário ter uma conta Spotify Premium para ouvir músicas completas.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se houver erro, mostrar mensagem
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600 font-medium">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, "_blank")}
        >
          Abrir no Spotify
        </Button>
      </div>
    )
  }

  // Mostrar player quando estiver pronto
  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={track.albumArt || "/placeholder.svg?height=48&width=48"}
          alt={track.album}
          className="w-12 h-12 rounded-md object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{track.name}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        </div>
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          type="button"
          disabled={!isReady || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, "_blank")}
          >
            Abrir no Spotify
          </Button>
        </div>
      </div>

      {!isReady && (
        <div className="flex items-center justify-center mt-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Conectando ao Spotify...</span>
        </div>
      )}
    </div>
  )
}
