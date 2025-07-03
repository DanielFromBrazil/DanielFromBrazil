"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { runDiagnostic } from "../actions"
// Importar o componente de proteção por senha
import { PasswordProtection } from "@/components/password-protection"

export default function DiagnosticPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runTests = async () => {
    setLoading(true)
    try {
      const diagnosticResults = await runDiagnostic()
      setResults(diagnosticResults)
    } catch (error) {
      console.error("Erro ao executar diagnóstico:", error)
      setResults({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PasswordProtection returnPath="/">
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Diagnóstico de Conexão</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Conectividade</CardTitle>
              <CardDescription>
                Executa testes para identificar problemas de conexão com o banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runTests} disabled={loading} className="mb-4">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando testes...
                  </>
                ) : (
                  "Executar Diagnóstico"
                )}
              </Button>

              {results && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-lg font-medium">Resultados:</h3>

                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Informações do Ambiente:</h4>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(results.environment, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Teste de DNS:</h4>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(results.dnsLookup, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Teste de Porta:</h4>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(results.portCheck, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">Teste de Conexão MySQL:</h4>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(results.mysqlConnection, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/" className="text-sm text-muted-foreground hover:underline">
                Voltar para a página inicial
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soluções Alternativas</CardTitle>
              <CardDescription>Opções para resolver problemas persistentes de conexão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Usar um Banco de Dados Serverless</h3>
                <p className="text-muted-foreground">
                  Bancos de dados serverless como PlanetScale, Neon ou Supabase funcionam muito bem com Vercel e não têm
                  problemas de firewall ou conectividade.
                </p>
                <div className="mt-2">
                  <Link href="https://planetscale.com/" target="_blank" className="text-primary hover:underline">
                    PlanetScale (MySQL)
                  </Link>{" "}
                  |
                  <Link href="https://neon.tech/" target="_blank" className="text-primary hover:underline ml-2">
                    Neon (PostgreSQL)
                  </Link>{" "}
                  |
                  <Link href="https://supabase.com/" target="_blank" className="text-primary hover:underline ml-2">
                    Supabase (PostgreSQL)
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">2. Configurar Proxy MySQL</h3>
                <p className="text-muted-foreground">
                  Se você precisa manter seu banco de dados atual, considere configurar um proxy MySQL que permita
                  conexões de qualquer IP.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">3. Usar SQLite com Vercel Blob Storage</h3>
                <p className="text-muted-foreground">
                  Para projetos menores, você pode usar SQLite com Vercel Blob Storage para armazenar o arquivo de banco
                  de dados.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PasswordProtection>
  )
}
