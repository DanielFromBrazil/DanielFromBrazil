"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SpotifyRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const trackId = searchParams.get("trackId")

    if (trackId) {
      // Redirecionar para a página de adição de conteúdo com a aba de música selecionada
      router.push(`/add-content?tab=music&trackId=${encodeURIComponent(trackId)}`)
    } else {
      // Se não houver trackId, redirecionar para a página de adição de conteúdo normal
      router.push("/add-content")
    }
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg">Redirecionando para a página de adição de conteúdo...</p>
      </div>
    </div>
  )
}
