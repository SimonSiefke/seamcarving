/**
 * Removes a seam from an imageData object.
 * @param imageData - the image data
 * @param seam the seam to remove
 * @return new image data without the seam
 */
export default function removeSeams(
  imageData: ImageData,
  seams: Uint32Array[]
) {
  const { width, height } = imageData;
  const newImageData = new Uint8ClampedArray(
    (width - seams.length) * height * 4
  );
  let newImageDataIndex = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (seams.find(seam => seam[y] === x)) {
        for (let i = 0; i < 4; i++) {
          const imageDataIndex = (y * width + x) * 4 + i;
          newImageData[newImageDataIndex++] = imageData.data[imageDataIndex];
        }
      }
    }
  }
  return new ImageData(newImageData, width - seams.length, height);
}
