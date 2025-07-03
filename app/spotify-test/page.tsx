"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { loginWithSpotify, isLoggedIn, logout } from "@/lib/spotify-auth"
import { SpotifyDebug } from "@/components/spotify-debug"

export default function SpotifyTestPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn())

  const handleLogin = () => {
    loginWithSpotify()
  }

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Teste de Integração com Spotify</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Status da Autenticação</CardTitle>
          <CardDescription>Verifique se a integração com o Spotify está funcionando corretamente</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Status atual:{" "}
            {isAuthenticated ? (
              <span className="text-green-600 font-medium">Conectado ao Spotify</span>
            ) : (
              <span className="text-amber-600 font-medium">Não conectado</span>
            )}
          </p>
        </CardContent>
        <CardFooter>
          {isAuthenticated ? (
            <Button onClick={handleLogout} variant="outline">
              Desconectar do Spotify
            </Button>
          ) : (
            <Button onClick={handleLogin} className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Conectar com Spotify
            </Button>
          )}
        </CardFooter>
      </Card>

      <SpotifyDebug />

      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h2 className="text-xl font-medium mb-4">Instruções para configuração</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Certifique-se de que você criou um aplicativo no{" "}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Spotify Developer Dashboard
            </a>
          </li>
          <li>
            Adicione{" "}
            <code className="bg-gray-200 px-1 py-0.5 rounded">
              {typeof window !== "undefined"
                ? `${window.location.origin}/spotify-callback`
                : "seu-site.com/spotify-callback"}
            </code>{" "}
            como URI de redirecionamento no dashboard
          </li>
          <li>
            Configure a variável de ambiente{" "}
            <code className="bg-gray-200 px-1 py-0.5 rounded">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> com o Client ID do
            seu aplicativo Spotify
          </li>
          <li>
            Certifique-se de que o aplicativo Spotify está configurado corretamente (não em modo de desenvolvimento)
          </li>
        </ol>
      </div>
    </div>
  )
}
