/**
 * Removes a seam from an imageData object.
 * @param imageData - the image data
 * @param seam the seam to remove
 * @return new image data without the seam
 */
export default function removeSeam(imageData: ImageData, seam: Uint32Array) {
  const { width, height } = imageData;
  const newImageData = new Uint8ClampedArray((width - 1) * height * 4);
  let newImageDataIndex = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let i = 0; i < 4; i++) {
        if (x !== seam[y]) {
          const imageDataIndex = (y * width + x) * 4 + i;
          newImageData[newImageDataIndex++] = imageData.data[imageDataIndex];
        }
      }
    }
  }
  return new ImageData(newImageData, width - 1, height);
}
