import computeEnergyMatrix from "@/lib/energy/computeEnergyMatrix";
import computeCumulatedEnergyMatrix from "@/lib/energy/computeCumulatedEnergyMatrix";
import computeSeams from "@/lib/seam/computeSeams";
import removeSeams from "@/lib/seam/removeSeams";
import addSeam from "@/lib/seam/addSeam";

addEventListener("message", event => {
  const action = event.data.action;
  const data = event.data.data;
  const buffer = data.buffer;
  const { width, height, numberOfSeams } = data;
  const array = new Uint8ClampedArray(buffer);
  const energyMatrix = computeEnergyMatrix({
    width,
    height,
    data: array
  });
  const cumulatedEnergyMatrix = computeCumulatedEnergyMatrix(energyMatrix);
  const seams = computeSeams(cumulatedEnergyMatrix, numberOfSeams);

  switch (action) {
    case "REMOVE_SEAMS":
      onRemoveSeams({ width, height, data: array }, seams);
      break;
    case "ADD_SEAMS":
      onAddSeams({ width, height, data: array }, seams);
      break;
    case "SHOW_SEAMS":
      onShowSeams({ width, height, data: array }, seams);
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
        width: width - 1,
        height
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
  const newImageData = addSeam({ data, width, height }, seams);

  self.postMessage(
    {
      action: "ADD_SEAM",
      data: {
        buffer: newImageData.data.buffer,
        width: width - 1,
        height
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
      let remove = false;
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
