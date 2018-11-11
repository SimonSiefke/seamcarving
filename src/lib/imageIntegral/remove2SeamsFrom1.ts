/**
 * Removes n seams from an imageData object for each given seam.
 * @param imageData - the image data
 * @param seam the seam to remove
 * @return new image data without the seam
 */
export default function removeNSeamsFrom1(
  imageData: ImageData,
  seams: Uint32Array[],
  factor: number
) {
  console.log(seams);
  const { width, height } = imageData;
  const newWidth = width - seams.length * factor;
  const newImageData = new Uint8ClampedArray(newWidth * height * 4);
  let newImageDataIndex = 0;
  for (let y = 0; y < height; y++) {
    let ins = 0;
    for (let x = 0; x < width; x++) {
      if (
        !seams.find(
          seam => seam[Math.floor(y / factor)] === Math.floor(x / factor)
        )
      ) {
        ins++;
        for (let i = 0; i < 4; i++) {
          const index = (y * width + x) * 4 + i;
          newImageData[newImageDataIndex++] = imageData.data[index];
        }
      }
    }
    console.log(ins);
  }
  // return newImageData;
  return new ImageData(newImageData, newWidth, height);
}

// const width = 5;
// const height = 4;
// const a = removeNSeamsFrom1(
//   {
//     // prettier-ignore
//     data: new Uint8ClampedArray([
//     1, 0, 0, 0,    2, 0, 0, 0,    3, 0, 0, 0,    4, 0, 0, 0,    5, 0, 0, 0,
//     6, 0, 0, 0,    7, 0, 0, 0,    8, 0, 0, 0,    9, 0, 0, 0,    10, 0, 0, 0,
//     11, 0, 0, 0,   12, 0, 0, 0,    13, 0, 0, 0,   14, 0, 0, 0,   15, 0, 0, 0,
//     16, 0, 0, 0,    17, 0, 0, 0,   18, 0, 0, 0,   19, 0, 0, 0,   20, 0, 0, 0,

//   ]),
//     width,
//     height
//   },
//   [new Uint32Array([1, 1])],
//   2
// );

// Array.from(a).filter(x => x); //?
