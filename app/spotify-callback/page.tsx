"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { saveAccessToken } from "@/lib/spotify-auth"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SpotifyCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<Record<string, any>>({})
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    // Função para processar o callback
    const processCallback = () => {
      try {
        setProcessing(true)

        // Extrair o hash da URL
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)

        // Extrair parâmetros da URL (incluindo query params)
        const queryParams = new URLSearchParams(window.location.search)
        const errorQuery = queryParams.get("error")
        const stateQuery = queryParams.get("state")

        // Verificar se há erro na query string
        if (errorQuery) {
          setError(errorQuery || "Erro desconhecido na autenticação")
          setProcessing(false)
          return
        }

        // Coletar informações para depuração
        const debugInfo: Record<string, any> = {
          hash: hash ? `${hash.substring(0, 20)}...` : "Vazio",
          params: Object.fromEntries(params.entries()),
          queryParams: Object.fromEntries(queryParams.entries()),
          storedState: localStorage.getItem("spotify_auth_state"),
          clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ? "Definido" : "Não definido",
          redirectUri: window.location.origin + "/spotify-callback",
        }

        setDebug(debugInfo)

        // Verificar se há erro no hash
        if (params.has("error")) {
          setError(params.get("error") || "Erro desconhecido na autenticação")
          setProcessing(false)
          return
        }

        // Extrair token e estado (do hash ou da query string)
        const accessToken = params.get("access_token")
        const state = params.get("state") || stateQuery
        const expiresIn = Number.parseInt(params.get("expires_in") || "3600", 10)

        // Verificar o estado para segurança
        const storedState = localStorage.getItem("spotify_auth_state")

        if (!state && !storedState) {
          // Se não temos nem estado nem storedState, podemos tentar continuar
          console.warn("Nenhum estado encontrado para validação")
        } else if (!state || state !== storedState) {
          setError(`Erro de validação de estado. Esperado: ${storedState}, Recebido: ${state || "null"}`)
          setProcessing(false)
          return
        }

        if (!accessToken) {
          setError("Token de acesso não encontrado")
          setProcessing(false)
          return
        }

        // Salvar o token
        saveAccessToken(accessToken, expiresIn)

        // Limpar dados temporários
        localStorage.removeItem("spotify_auth_state")
        localStorage.removeItem("spotify_track_id")

        // Sempre redirecionar para a página inicial após o login
        router.push("/")
      } catch (err) {
        console.error("Erro ao processar callback:", err)
        setError(`Erro ao processar callback: ${err instanceof Error ? err.message : String(err)}`)
        setProcessing(false)
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Erro na autenticação</h1>
          <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
            <p className="font-medium">Erro:</p>
            <p className="break-all">{error}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-md text-left text-sm mb-4 overflow-auto max-h-60">
            <p className="font-medium mb-2">Informações de depuração:</p>
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>

          <Button onClick={() => router.push("/")} className="px-4 py-2 bg-primary text-white rounded-md">
            Voltar para o início
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Autenticando com o Spotify</h1>
          <p className="text-muted-foreground">Aguarde enquanto processamos seu login...</p>
        </div>
      )}
    </div>
  )
}
