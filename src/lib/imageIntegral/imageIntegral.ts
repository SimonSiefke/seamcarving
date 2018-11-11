/**
 * Computes a cumulated energy matrix for an image, each entry corresponds to the entry in the energy matrix plus the minimum of the energy top-left, top or top-right.
 * @param param - An object of parameters.
 * @param param.energyMatrix - the energy matrix
 * @param param.width - the width of the image
 * @param param.height - the height of the image
 * @return the cumulated energy matrix
 */
export default function computeImageIntegral({
  energyMatrix,
  width,
  height
}: {
  energyMatrix: Float32Array;
  width: number;
  height: number;
}) {
  const imageIntegral = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    imageIntegral[y * width] = energyMatrix[y * width];
  }

  for (let x = 1; x < width; x++) {
    for (let y = 0; y < height; y++) {
      imageIntegral[y * width + x] =
        energyMatrix[y * width + x] + imageIntegral[y * width + x - 1];
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 1; y < height; y++) {
      imageIntegral[y * width + x] += imageIntegral[(y - 1) * width + x];
    }
  }
  return imageIntegral;
}

const width = 4;
const height = 4;
const a = computeImageIntegral({
  // prettier-ignore
  energyMatrix:new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,2,0,
    4,1,0,0,

  ]),
  width,
  height
});

function difference(x1: number, y1: number, x2: number, y2: number) {
  // bottom right
  let result = a[y2 * width + x2];
  // top right
  if (x1 > 0) {
    result; //?
    result -= a[y2 * width + x1 - 1];
  }
  // bottom left
  if (y1 > 0) {
    result; //?
    result -= a[(y1 - 1) * width + x2];
  }
  // topLeft
  if (y1 > 0 && x1 > 0) {
    result; //?
    result += a[(y1 - 1) * width + (x1 - 1)];
  }
  return result;
}

Array.from(a); //?

difference(2, 0, 1, 3); //?

for (let x1 = 0; x1 < width; x1++) {
  for (let x2 = 0; x2 < width; x2++) {
    const topEnergy = a[x1];
    const bottomEnergy = a[(height - 1) * width + x2];
    topEnergy;
    bottomEnergy;
  }
}
Array.from(a); //?
