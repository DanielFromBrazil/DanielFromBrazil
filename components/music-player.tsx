"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, ExternalLink } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import type { Track } from "./music-search"
import { isLoggedIn, loginWithSpotify } from "@/lib/spotify-auth"
import { SpotifyPlayer } from "./spotify-player"

interface MusicPlayerProps {
  track: Track
}

export function MusicPlayer({ track }: MusicPlayerProps) {
  // Verificar se o usuário está logado no Spotify
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn())

  // Se o usuário estiver logado, usar o player do Spotify
  if (isAuthenticated) {
    return <SpotifyPlayer track={track} />
  }

  // Código existente para o player de prévia
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar o áudio quando o componente montar ou a faixa mudar
  useEffect(() => {
    if (!track.previewUrl) {
      setError("Prévia não disponível para esta música")
      return
    }

    setError(null)

    // Limpar o áudio anterior se existir
    if (audioRef.current) {
      audioRef.current.pause()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    // Criar novo elemento de áudio
    const audio = new Audio(track.previewUrl)
    audio.volume = volume
    audio.preload = "metadata"

    audio.addEventListener("error", (e) => {
      console.error("Erro ao carregar áudio:", e)
      setError("Não foi possível carregar a prévia da música")
      setIsPlaying(false)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    })

    audioRef.current = audio
    setCurrentTime(0)
    setIsPlaying(false)

    // Limpar ao desmontar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [track.previewUrl, volume])

  // Atualizar o volume quando mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que o clique propague para elementos pai

    if (!audioRef.current || !track.previewUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      // Adicionar tratamento de erros ao reproduzir
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            // Atualizar o tempo atual a cada 100ms
            intervalRef.current = setInterval(() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime)
              }
            }, 100)
          })
          .catch((error) => {
            console.error("Erro ao reproduzir áudio:", error)
            setError("Não foi possível reproduzir a prévia da música")
            setIsPlaying(false)
          })
      }
    }
  }

  const handleTimeChange = (value: number[]) => {
    if (!audioRef.current) return

    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que o clique propague para elementos pai
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  // Formatar o tempo em MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Calcular a duração máxima (30 segundos para prévias do Spotify)
  const maxDuration = track.duration ? Math.min(track.duration / 1000, 30) : 30

  // Abrir no Spotify
  const openInSpotify = () => {
    window.open(`https://open.spotify.com/track/${track.id}`, "_blank")
  }

  // Se não houver prévia disponível, mostrar uma interface alternativa com link para o Spotify
  if (!track.previewUrl) {
    return (
      <div className="music-player-controls bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
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

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white" onClick={openInSpotify}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvir no Spotify
              </Button>

              <Button variant="outline" onClick={() => loginWithSpotify(track.id)}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Entrar com Spotify
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Esta música não possui prévia disponível. Você pode ouvir no Spotify ou fazer login para ouvir a música
              completa aqui.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="music-player-controls bg-muted p-4 rounded-lg">
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
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          type="button"
          disabled={!!error}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Slider
            value={[currentTime]}
            max={maxDuration}
            step={0.1}
            onValueChange={handleTimeChange}
            className="music-player-slider"
            disabled={!!error}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(maxDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground transition-colors"
              type="button"
              disabled={!!error}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24 music-player-slider"
              disabled={!!error}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openInSpotify} className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              Ouvir completa
            </Button>

            <Button variant="outline" size="sm" onClick={() => loginWithSpotify(track.id)} className="text-xs">
              <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Entrar com Spotify
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">{error}</div>}
    </div>
  )
}
