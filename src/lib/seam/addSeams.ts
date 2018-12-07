import { pixelAt } from "../util"

/**
 * Adds a new pixels along a given seam to an image data object.
 * @param imageData - the image data
 * @param seam - the minimum energy seam at which new pixels can be inserted
 * @return the image data with the new pixels inserted
 */
export default function addSeams(imageData: ImageData, seams: Uint32Array[]) {
  const { width, height } = imageData
  const newImageData = new Uint8ClampedArray(
    (width + seams.length) * height * 4
  )
  let newImageDataIndex = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (seams.find(seam => seam[y] === x)) {
        const leftPixel = pixelAt(imageData, Math.max(x - 1, 0), y)
        const currentPixel = pixelAt(imageData, x, y)
        const rightPixel = pixelAt(imageData, Math.min(x, width - 1), y)
        const r1 = Math.round((leftPixel.r + currentPixel.r) / 2)
        const g1 = Math.round((leftPixel.g + currentPixel.g) / 2)
        const b1 = Math.round((leftPixel.b + currentPixel.b) / 2)
        newImageData[newImageDataIndex++] = r1
        newImageData[newImageDataIndex++] = g1
        newImageData[newImageDataIndex++] = b1
        newImageData[newImageDataIndex++] = 255
        const r2 = Math.round((currentPixel.r + rightPixel.r) / 2)
        const g2 = Math.round((currentPixel.g + rightPixel.g) / 2)
        const b2 = Math.round((currentPixel.b + rightPixel.b) / 2)
        newImageData[newImageDataIndex++] = r2
        newImageData[newImageDataIndex++] = g2
        newImageData[newImageDataIndex++] = b2
        newImageData[newImageDataIndex++] = 255
      } else {
        for (let i = 0; i < 4; i++) {
          const imageDataIndex = (y * width + x) * 4 + i
          newImageData[newImageDataIndex++] = imageData.data[imageDataIndex]
        }
      }
    }
  }
  return new ImageData(newImageData, width + seams.length, height)
}
