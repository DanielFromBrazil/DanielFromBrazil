import { v2 as cloudinary } from "cloudinary"

// Configurar o Cloudinary com as credenciais
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Função para fazer upload de um arquivo para o Cloudinary
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string
    fileName?: string
    resourceType?: "image" | "video" | "raw" | "auto"
  } = {},
) {
  const { folder = "amor-digital", fileName, resourceType = "auto" } = options

  return new Promise<{
    public_id: string
    secure_url: string
    format: string
    resource_type: string
  }>((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
    }

    if (fileName) {
      uploadOptions.public_id = fileName.split(".")[0] // Remove a extensão
    }

    // Fazer upload do buffer para o Cloudinary
    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Erro ao fazer upload para o Cloudinary:", error)
          return reject(error)
        }

        if (!result) {
          return reject(new Error("Resultado do upload indefinido"))
        }

        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          resource_type: result.resource_type,
        })
      })
      .end(buffer)
  })
}

// Função para obter URL de um arquivo do Cloudinary
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: "fill" | "scale" | "fit" | "pad" | "limit"
    format?: "jpg" | "png" | "webp" | "auto"
  } = {},
) {
  const { width, height, crop = "fill", format = "auto" } = options

  const transformations = []

  if (width || height) {
    transformations.push(`c_${crop}`)
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
  }

  if (format !== "auto") {
    transformations.push(`f_${format}`)
  }

  const transformationString = transformations.length > 0 ? transformations.join(",") + "/" : ""

  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations.length > 0 ? transformations : undefined,
  })
}

// Função para excluir um arquivo do Cloudinary
export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error("Erro ao excluir arquivo do Cloudinary:", error)
    throw error
  }
}
