import { argmin } from "../util";

/**
 * Computes a seam, a path of minimum energy from top to bottom.
 * @param param - An object of parameters.
 * @param param.cumulatedEnergyMatrix - the cumulated energy matrix
 * @param param.width - the width of the image
 * @param param.height - the height of the image
 */
export default function computeSeam({
  cumulatedEnergyMatrix,
  width,
  height
}: {
  cumulatedEnergyMatrix: Float32Array;
  width: number;
  height: number;
}) {
  const seam = new Uint32Array(height);
  let currentX = argmin(cumulatedEnergyMatrix.slice(0, width));
  seam[0] = currentX;
  for (let y = 1; y < height; y++) {
    const yIndexTop = (y - 1) * width;
    const energyTopLeft =
      cumulatedEnergyMatrix[yIndexTop + Math.max(currentX - 1, 0)];
    const energyTop = cumulatedEnergyMatrix[yIndexTop + currentX];
    const energyTopRight =
      cumulatedEnergyMatrix[yIndexTop + Math.min(width - 1, currentX)];
    const offsetX = argmin([energyTopLeft, energyTop, energyTopRight]) - 1;
    currentX = Math.max(Math.min(currentX + offsetX, width - 1), 0);
    seam[y] = currentX;
  }
  return seam;
}
