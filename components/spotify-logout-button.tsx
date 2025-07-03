"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logout, isLoggedIn } from "@/lib/spotify-auth"
import { useState, useEffect } from "react"

export default function SpotifyLogoutButton() {
  const [loggedIn, setLoggedIn] = useState(false)

  // Verificar o status de login quando o componente montar
  useEffect(() => {
    // Só executar no cliente
    if (typeof window !== "undefined") {
      setLoggedIn(isLoggedIn())

      // Verificar periodicamente o status de login (para expiração do token)
      const interval = setInterval(() => {
        setLoggedIn(isLoggedIn())
      }, 60000) // Verificar a cada minuto

      return () => clearInterval(interval)
    }
  }, [])

  // Função para fazer logout
  const handleLogout = () => {
    logout()
    setLoggedIn(false)
  }

  // Se não estiver logado, não mostrar o botão
  if (!loggedIn) return null

  return (
    <Button
      onClick={handleLogout}
      className="bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full flex items-center gap-2 px-3 py-1 h-8"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        className="mr-1"
      >
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.059 14.406c-.192.192-.459.277-.709.277s-.517-.085-.709-.277a.988.988 0 0 1 0-1.418c2.047-2.047 2.047-5.378 0-7.425a.988.988 0 0 1 0-1.418.988.988 0 0 1 1.418 0c2.876 2.876 2.876 7.567 0 10.443zm-2.59-2.59c-.192.192-.459.277-.709.277s-.517-.085-.709-.277a.988.988 0 0 1 0-1.418c.902-.902.902-2.368 0-3.27a.988.988 0 0 1 0-1.418.988.988 0 0 1 1.418 0c1.73 1.73 1.73 4.376 0 6.106zm-2.59-2.59c-.192.192-.459.277-.709.277s-.517-.085-.709-.277a.988.988 0 0 1 0-1.418c.243-.243.243-.637 0-.88a.988.988 0 0 1 0-1.418.988.988 0 0 1 1.418 0c1.072 1.072 1.072 2.644 0 3.716z" />
      </svg>
      <span className="hidden sm:inline text-xs font-bold">Sair</span>
      <LogOut className="h-3 w-3" />
    </Button>
  )
}
