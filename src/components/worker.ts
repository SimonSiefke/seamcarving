import computeEnergyMatrix, {
  computeSmallEnergyMatrix
} from "@/lib/energy/computeEnergyMatrix";
import computeCumulatedEnergyMatrix from "@/lib/energy/computeCumulatedEnergyMatrix";
import computeSeams from "@/lib/seam/computeSeams";
import removeSeams from "@/lib/seam/removeSeams";
import addSeams from "@/lib/seam/addSeams";
import removeNSeamsFrom1 from "@/lib/imageIntegral/remove2SeamsFrom1";

const factor = 4;

addEventListener("message", event => {
  const action = event.data.action;
  const data = event.data.data;
  const buffer = data.buffer;
  const { width, height, numberOfSeams } = data;
  const array = new Uint8ClampedArray(buffer);
  // console.time("compute full energy matrix");
  const energyMatrix = computeEnergyMatrix({
    width,
    height,
    data: array
  });
  const cumulatedEnergyMatrix = computeCumulatedEnergyMatrix(energyMatrix);
  // console.timeEnd("compute full energy matrix");
  const seams = computeSeams(cumulatedEnergyMatrix, numberOfSeams);
  // console.time("compute small energy matrix");
  const smallEnergyMatrix = computeSmallEnergyMatrix(
    {
      width,
      height,
      data: array
    },
    factor
  );

  const smallCumulatedEnergyMatrix = computeCumulatedEnergyMatrix(
    smallEnergyMatrix
  );
  // console.timeEnd("compute small energy matrix");

  const smallSeams = computeSeams(
    smallCumulatedEnergyMatrix,
    Math.floor(numberOfSeams / factor)
  );

  switch (action) {
    case "REMOVE_SEAMS":
      onRemoveSeams({ width, height, data: array }, seams);
      break;
    case "REMOVE_SMALL_SEAMS":
      onRemove2SeamsFrom1({ width, height, data: array }, smallSeams);
      break;
    case "ADD_SEAMS":
      onAddSeams({ width, height, data: array }, seams);
      break;
    case "SHOW_SEAMS":
      onShowSeams({ width, height, data: array }, seams);
      break;
    case "SHOW_SMALL_SEAMS":
      onShowSmallSeams({ width, height, data: array }, seams);
      break;
    default:
      break;
  }
});

function onRemoveSeams(
  {
    width,
    height,
    data
  }: { width: number; height: number; data: Uint8ClampedArray },
  seams: Uint32Array[]
) {
  const newImageData = removeSeams({ data, width, height }, seams);

  self.postMessage(
    {
      action: "REMOVE_SEAM",
      data: {
        buffer: newImageData.data.buffer,
        width: newImageData.width,
        height: newImageData.height
      }
    },
    // @ts-ignore
    [newImageData.data.buffer]
  );
}

function onAddSeams(
  {
    width,
    height,
    data
  }: { width: number; height: number; data: Uint8ClampedArray },
  seams: Uint32Array[]
) {
  const newImageData = addSeams({ data, width, height }, seams);

  self.postMessage(
    {
      action: "ADD_SEAM",
      data: {
        buffer: newImageData.data.buffer,
        width: newImageData.width,
        height: newImageData.height
      }
    },
    // @ts-ignore
    [newImageData.data.buffer]
  );
}

function onShowSeams(
  {
    width,
    height,
    data
  }: { width: number; height: number; data: Uint8ClampedArray },
  seams: Uint32Array[]
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (seams.find(seam => seam[y] === x)) {
        const index = (y * width + x) * 4;
        data[index] = 255;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 255;
      }
    }
  }
  self.postMessage(
    {
      action: "SHOW_SEAMS",
      data: {
        buffer: data.buffer,
        width,
        height
      }
    },
    // @ts-ignore
    [data.buffer]
  );
}

function onShowSmallSeams(
  {
    width,
    height,
    data
  }: { width: number; height: number; data: Uint8ClampedArray },
  smallSeams: Uint32Array[]
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        smallSeams.find(
          seam => seam[Math.floor(y / factor)] === Math.floor(x / factor)
        )
      ) {
        const index = (y * width + x) * 4;
        data[index] = 255;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 255;
      }
    }
  }
  self.postMessage(
    {
      action: "SHOW_SEAMS",
      data: {
        buffer: data.buffer,
        width,
        height
      }
    },
    // @ts-ignore
    [data.buffer]
  );
}

function onRemove2SeamsFrom1(
  {
    width,
    height,
    data
  }: { width: number; height: number; data: Uint8ClampedArray },
  seams: Uint32Array[]
) {
  const newImageData = removeNSeamsFrom1(
    {
      width,
      height,
      data
    },
    seams,
    factor
  );
  self.postMessage(
    {
      action: "REMOVE_2_SEAMS_FROM_1",
      data: {
        buffer: newImageData.data.buffer,
        width: newImageData.width,
        height: newImageData.height
      }
    },
    // @ts-ignore
    [data.buffer]
  );
}
