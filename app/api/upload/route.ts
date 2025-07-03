import { type NextRequest, NextResponse } from "next/server"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())

      // Determinar o tipo de recurso com base no tipo MIME
      let resourceType: "image" | "video" | "raw" | "auto" = "auto"
      if (file.type.startsWith("image/")) resourceType = "image"
      else if (file.type.startsWith("video/")) resourceType = "video"

      // Fazer upload para o Cloudinary
      const result = await uploadToCloudinary(buffer, {
        fileName: `${Date.now()}-${file.name}`,
        resourceType,
      })

      uploadedFiles.push({
        name: file.name,
        path: result.secure_url,
        public_id: result.public_id,
        type: file.type,
        size: file.size,
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("Erro ao enviar arquivos:", error)
    return NextResponse.json({ error: "Falha ao enviar arquivos" }, { status: 500 })
  }
}
