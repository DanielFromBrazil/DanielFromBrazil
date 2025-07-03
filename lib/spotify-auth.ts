// Configuração e funções para autenticação com o Spotify

// Constantes para autenticação
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string
// Usar exatamente a mesma URL de redirecionamento que você registrou no Dashboard do Spotify
const REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}/spotify-callback`
    : "https://danieleluiza.vercel.app/spotify-callback"

// Escopos que precisamos solicitar
const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
]

// Gerar um estado aleatório para segurança
export function generateRandomString(length: number): string {
  let text = ""
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

// Iniciar o processo de login
export function loginWithSpotify(trackId?: string): void {
  const state = generateRandomString(16)

  // Salvar o estado e o trackId para verificação posterior
  localStorage.setItem("spotify_auth_state", state)

  // Se tiver um trackId, verificar se é um ID válido antes de salvar
  if (trackId) {
    console.log("Salvando trackId para uso após autenticação:", trackId)
    localStorage.setItem("spotify_track_id", trackId)
  }

  // Construir a URL de autorização
  const authUrl = new URL("https://accounts.spotify.com/authorize")

  // Adicionar parâmetros
  authUrl.searchParams.append("response_type", "token")
  authUrl.searchParams.append("client_id", CLIENT_ID)
  authUrl.searchParams.append("scope", SCOPES.join(" "))
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI)
  authUrl.searchParams.append("state", state)
  authUrl.searchParams.append("show_dialog", "true")

  // Redirecionar para a página de login do Spotify
  window.location.href = authUrl.toString()
}

// Verificar se o usuário está logado
export function isLoggedIn(): boolean {
  return !!getAccessToken() && !isTokenExpired()
}

// Obter o token de acesso
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("spotify_access_token")
}

// Salvar o token de acesso
export function saveAccessToken(token: string, expiresIn: number): void {
  localStorage.setItem("spotify_access_token", token)

  // Salvar quando o token expira
  const expirationTime = Date.now() + expiresIn * 1000
  localStorage.setItem("spotify_token_expiration", expirationTime.toString())
}

// Verificar se o token expirou
export function isTokenExpired(): boolean {
  const expirationTime = localStorage.getItem("spotify_token_expiration")
  if (!expirationTime) return true

  return Date.now() > Number.parseInt(expirationTime, 10)
}

// Limpar dados de autenticação
export function logout(): void {
  localStorage.removeItem("spotify_access_token")
  localStorage.removeItem("spotify_token_expiration")
  localStorage.removeItem("spotify_auth_state")
}
