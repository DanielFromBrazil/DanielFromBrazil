"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database, Check, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { runDatabaseMigration } from "../actions"
import { PasswordProtection } from "@/components/password-protection"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
  }>({})
  const { toast } = useToast()

  const handleMigration = async () => {
    setLoading(true)
    try {
      const migrationResult = await runDatabaseMigration()
      setResult(migrationResult)

      if (migrationResult.success) {
        toast({
          title: "Migração concluída",
          description: migrationResult.message,
          variant: "default",
          icon: <Check className="h-4 w-4 text-green-500" />,
        })
      } else {
        toast({
          title: "Erro na migração",
          description: migrationResult.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao executar migração:", error)
      setResult({
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : String(error)}`,
      })

      toast({
        title: "Erro na migração",
        description: `Ocorreu um erro: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PasswordProtection returnPath="/">
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Administração do Sistema</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Migração do Banco de Dados</CardTitle>
              <CardDescription>Adiciona a coluna 'public_id' à tabela 'files' se ela não existir</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Use esta opção para corrigir o erro "Unknown column 'public_id' in 'field list'" ao adicionar memórias.
              </p>

              {result.message && (
                <div
                  className={`p-4 rounded-md mb-4 ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                >
                  {result.success ? (
                    <div className="flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      <span>{result.message}</span>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{result.message}</span>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleMigration} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando migração...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Executar Migração
                  </>
                )}
              </Button>
            </CardContent>
            <CardFooter>
              <Link href="/" className="text-sm text-muted-foreground hover:underline">
                Voltar para a página inicial
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PasswordProtection>
  )
}
