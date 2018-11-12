import computeEnergyMatrix, {
  EnergyMatrix
} from "@/lib/energy/computeEnergyMatrix";
import computeCumulatedEnergyMatrix, {
  CumulatedEnergyMatrix
} from "@/lib/energy/computeCumulatedEnergyMatrix";
import computeSeams from "@/lib/seam/computeSeams";
import removeSeams from "@/lib/seam/removeSeams";
import addSeams from "@/lib/seam/addSeams";
import { ActionType } from "./action";

let cumulatedEnergyMatrix: CumulatedEnergyMatrix;
let energyMatrix: EnergyMatrix;
let imageData: ImageData;
let initializationPromise: Promise<void>;

/**
 * Computes and assigns the energy matrix and the cumulated energy matrix for the given image data. This must only be done once for every image.
 * @param _imageData - the image data
 */
async function onInitialize(_imageData: ImageData) {
  imageData = _imageData;
  const { width, height, data } = imageData;
  energyMatrix = computeEnergyMatrix({
    width,
    height,
    data
  });
  cumulatedEnergyMatrix = computeCumulatedEnergyMatrix(energyMatrix);
  // @ts-ignore
  self.postMessage({
    action: "INITIALIZE",
    data: {}
  });
}

addEventListener("message", async event => {
  if (initializationPromise) {
    await initializationPromise;
  }
  const action = event.data.action as ActionType;
  const data = event.data.data;
  let seams!: Uint32Array[];
  if (data.numberOfSeams) {
    const numberOfSeams = Math.abs(data.numberOfSeams);
    seams = computeSeams(cumulatedEnergyMatrix, numberOfSeams);
  }

  switch (action) {
    case "INITIALIZE":
      const { width, height, buffer } = data;
      const array = new Uint8ClampedArray(buffer);
      initializationPromise = onInitialize({ width, height, data: array });
      break;
    case "REMOVE_SEAMS":
      onRemoveSeams(imageData, seams);
      break;
    case "ADD_SEAMS":
      onAddSeams(imageData, seams);
      break;
    case "SHOW_SEAMS":
      onShowSeams(imageData, seams);
      break;
    default:
      break;
  }
});

/**
 * Computes an image data object with the given seams added.
 * @param param0
 * @param seams - the seams to add
 */
function onAddSeams({ width, height, data }: ImageData, seams: Uint32Array[]) {
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

/**
 * Computes an image data object with the given seams removed.
 * @param param0
 * @param seams - the seams to remove
 */
function onRemoveSeams(
  { width, height, data }: ImageData,
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

/**
 * Computes an image data object that visualizes the seams as red pixels.
 * @param param0
 * @param seams
 */
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
