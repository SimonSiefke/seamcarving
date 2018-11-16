import { EnergyMatrix } from "./computeEnergyMatrix"

export interface CumulatedEnergyMatrix {
  width: number
  height: number
  cumulatedEnergyMatrix: Float32Array
}

/**
 * Computes a cumulated energy matrix for an image, each entry corresponds to the entry in the energy matrix plus the minimum of the energy top-left, top or top-right.
 * @param param - An object of parameters.
 * @param param.energyMatrix - the energy matrix
 * @param param.width - the width of the image
 * @param param.height - the height of the image
 * @return the cumulated energy matrix
 */
export default function computeCumulatedEnergyMatrix({
  energyMatrix,
  width,
  height
}: EnergyMatrix) {
  const cumulatedEnergyMatrix = new Float32Array(width * height)
  for (let x = 0; x < width; x++) {
    cumulatedEnergyMatrix[x] = energyMatrix[x]
  }
  for (let y = 1; y < height; y++) {
    const yIndex = y * width
    const yIndexTop = (y - 1) * width
    for (let x = 0; x < width; x++) {
      const energyTopLeft = energyMatrix[yIndexTop + Math.max(x - 1, 0)]
      const energyTop = energyMatrix[yIndexTop + x]
      const energyTopRight = energyMatrix[yIndexTop + Math.min(x, width - 1)]
      cumulatedEnergyMatrix[yIndex + x] =
        energyMatrix[yIndex + x] +
        Math.min(energyTopLeft, energyTop, energyTopRight)
    }
  }
  return { cumulatedEnergyMatrix, width, height }
}
