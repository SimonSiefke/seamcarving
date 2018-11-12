import { pixelAt, Pixel } from "../util";

export interface EnergyMatrix {
  width: number;
  height: number;
  energyMatrix: Float32Array;
}

/**
 * Computes the difference between two pixels.
 * @param firstPixel - the first pixel
 * @param secondPixel - the second pixel
 * @return the difference between the two pixels
 */
function difference(firstPixel: Pixel, secondPixel: Pixel) {
  const rDifference = firstPixel.r - secondPixel.r;
  const gDifference = firstPixel.g - secondPixel.g;
  const bDifference = firstPixel.b - secondPixel.b;
  return Math.sqrt(rDifference ** 2 + gDifference ** 2 + bDifference ** 2);
}

/**
 * Computes the energy of a pixel at position (x,y).
 * @param imageData - the image data
 * @param x - the horizontal position
 * @param y - the vertical position
 * @return the energy of the pixel
 */
function energyAt(imageData: ImageData, x: number, y: number) {
  const { width, height } = imageData;
  const leftPixel = pixelAt(imageData, Math.max(x - 1, 0), y);
  const rightPixel = pixelAt(imageData, Math.min(x + 1, width - 1), y);
  const bottomPixel = pixelAt(imageData, x, Math.max(y - 1, 0));
  const topPixel = pixelAt(imageData, x, Math.min(y + 1, height - 1));
  const dx = difference(leftPixel, rightPixel);
  const dy = difference(bottomPixel, topPixel);
  return dx + dy;
}

/**
 * Computes an energy matrix for an image, each entry corresponds to the energy of a pixel in the image.
 * @param imageData - the image data
 * @return the energy matrix
 */
export default function computeEnergyMatrix(
  imageData: ImageData
): EnergyMatrix {
  const { width, height } = imageData;
  const energyMatrix = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const yIndex = y * width;
    for (let x = 0; x < width; x++) {
      energyMatrix[yIndex + x] = energyAt(imageData, x, y);
    }
  }
  return { energyMatrix, width, height };
}

export function computeSmallEnergyMatrix(
  imageData: ImageData,
  factor: number
): EnergyMatrix {
  const { width, height } = imageData;
  const newWidth = Math.floor(width / factor);
  const newHeight = Math.floor(height / factor);
  const energyMatrix = computeEnergyMatrix(imageData);
  const newEnergyMatrix = new Float32Array(newWidth * newHeight).fill(0);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      newEnergyMatrix[
        Math.floor(y / factor) * newWidth + Math.floor(x / factor)
      ] += energyMatrix.energyMatrix[y * width + x];
    }
  }
  return { energyMatrix: newEnergyMatrix, width: newWidth, height: newHeight };
}
