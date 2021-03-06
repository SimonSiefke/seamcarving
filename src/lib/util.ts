/**
 * Computes the index of the minimum element in a given array.
 * @param array - the array
 */
export function argmin(
  array:
    | any[]
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array
) {
  let min = Infinity
  let minIndex = -1
  for (let i = 0; i < array.length; i++) {
    if (array[i] < min) {
      min = array[i]
      minIndex = i
    }
  }
  return minIndex
}

/**
 * Computes a new image data object where width and height are flipped.
 * @param imageData - the image data to rotate
 */
export function rotateImageData(imageData: ImageData) {
  const { width, height, data } = imageData
  const newImageData = new Uint8ClampedArray(width * height * 4)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let i = 0; i < 4; i++) {
        const oldIndex = (y * width + x) * 4 + i
        const newIndex = (x * height + y) * 4 + i
        oldIndex
        newIndex
        newImageData[newIndex] = data[oldIndex]
      }
    }
  }
  return {
    width: height,
    height: width,
    data: newImageData
  }
}

export interface Pixel {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Computes the pixel colors for a given position.
 * @param imageData the image data from where you want to get the pixel
 * @param x the horizontal position
 * @param y the vertical position
 * @return the different colors at the given position
 */
export function pixelAt(imageData: ImageData, x: number, y: number) {
  const index = (y * imageData.width + x) * 4
  const r = imageData.data[index]
  const g = imageData.data[index + 1]
  const b = imageData.data[index + 2]
  const a = imageData.data[index + 3]
  return { r, g, b, a }
}
