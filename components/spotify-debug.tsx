"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getAccessToken, isLoggedIn, isTokenExpired, logout } from "@/lib/spotify-auth"

export function SpotifyDebug() {
  const [clientId, setClientId] = useState<string>("")
  const [authStatus, setAuthStatus] = useState<{
    isLoggedIn: boolean
    token: string | null
    isExpired: boolean
  }>({
    isLoggedIn: false,
    token: null,
    isExpired: true,
  })

  useEffect(() => {
    // Verificar o status de autenticação
    const checkAuth = () => {
      const token = getAccessToken()
      const expired = isTokenExpired()
      const logged = isLoggedIn()

      setAuthStatus({
        isLoggedIn: logged,
        token: token ? `${token.substring(0, 10)}...` : null,
        isExpired: expired,
      })
    }

    checkAuth()

    // Verificar o CLIENT_ID
    if (typeof window !== "undefined") {
      // Apenas para depuração - não faça isso em produção
      setClientId(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "Não definido")
    }

    // Verificar a cada 5 segundos
    const interval = setInterval(checkAuth, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Depuração do Spotify</CardTitle>
        <CardDescription>Informações para ajudar a solucionar problemas de autenticação</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Client ID:</div>
          <div>{clientId || "Não disponível"}</div>

          <div className="font-medium">Status de Login:</div>
          <div>{authStatus.isLoggedIn ? "✅ Logado" : "❌ Não logado"}</div>

          <div className="font-medium">Token:</div>
          <div>{authStatus.token || "Nenhum token"}</div>

          <div className="font-medium">Token Expirado:</div>
          <div>{authStatus.isExpired ? "⚠️ Sim" : "✅ Não"}</div>

          <div className="font-medium">Redirect URI:</div>
          <div>{typeof window !== "undefined" ? `${window.location.origin}/spotify-callback` : "N/A"}</div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={logout} className="w-full">
          Logout do Spotify
        </Button>
      </CardFooter>
    </Card>
  )
}
