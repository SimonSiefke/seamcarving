import { argmin } from "../util";

/**
 * Computes a seam, a path of minimum energy from top to bottom.
 * @param param - An object of parameters.
 * @param param.cumulatedEnergyMatrix - the cumulated energy matrix
 * @param param.width - the width of the image
 * @param param.height - the height of the image
 * @param numberOfSeam - the number of seams to compute
 */
export default function computeSeams(
  {
    cumulatedEnergyMatrix,
    width,
    height
  }: {
    cumulatedEnergyMatrix: Float32Array;
    width: number;
    height: number;
  },
  numberOfSeams: number
) {
  const seams = Array.from(Array(numberOfSeams), () => new Uint32Array(height));
  const firstRow = Array.from(cumulatedEnergyMatrix.slice(0, width));
  // TODO find k smallest elements faster
  const indicesOfSmallestEnergiesInFirstRow = firstRow
    .map((value, index) => [value, index])
    .sort(([a], [b]) => a - b)
    .slice(0, numberOfSeams)
    .map(([_, index]) => index);
  for (let i = 0; i < numberOfSeams; i++) {
    seams[i][0] = indicesOfSmallestEnergiesInFirstRow[i];
  }
  const occupied = new Array(width * height).fill(false);
  for (let i = 0; i < numberOfSeams; i++) {
    const seam = seams[i];
    let currentX = seam[0];
    for (let y = 1; y < height; y++) {
      const yIndexTop = (y - 1) * width;
      let xLeftIndex = currentX - 1;
      for (; xLeftIndex > 0; xLeftIndex--) {
        if (!occupied[yIndexTop + xLeftIndex]) {
          break;
        }
      }
      const energyTopLeft =
        xLeftIndex < 0 || occupied[yIndexTop + xLeftIndex]
          ? Infinity
          : cumulatedEnergyMatrix[yIndexTop + xLeftIndex];
      const energyTop = occupied[yIndexTop + currentX]
        ? Infinity
        : cumulatedEnergyMatrix[yIndexTop + currentX];
      let xRightIndex = currentX + 1;
      for (; xRightIndex < width; xRightIndex++) {
        if (!occupied[yIndexTop + xRightIndex]) {
          break;
        }
      }
      const energyTopRight =
        xRightIndex > width - 1 || occupied[yIndexTop + xRightIndex]
          ? Infinity
          : cumulatedEnergyMatrix[yIndexTop + xRightIndex];
      const minEnergy = Math.min(energyTopLeft, energyTop, energyTopRight);
      if (minEnergy === energyTopLeft) {
        currentX = xLeftIndex;
      } else if (minEnergy === energyTop) {
        // currentX stays the same
      } else {
        currentX = xRightIndex;
      }
      seam[y] = currentX;
      occupied[yIndexTop + currentX] = true;
    }
  }
  return seams;
}
