import computeEnergyMatrix from "@/lib/energy/computeEnergyMatrix";
import computeCumulatedEnergyMatrix from "@/lib/energy/computeCumulatedEnergyMatrix";
import computeSeam from "@/lib/seam/computeSeam";
import removeSeam from "@/lib/seam/removeSeam";
import addSeam from "@/lib/seam/addSeam";

addEventListener("message", event => {
  const action = event.data.action;
  const data = event.data.data;
  const buffer = data.buffer;
  const { width, height } = data;
  const array = new Uint8ClampedArray(buffer);
  const energyMatrix = computeEnergyMatrix({
    width,
    height,
    data: array
  });
  const cumulatedEnergyMatrix = computeCumulatedEnergyMatrix(energyMatrix);
  const seam = computeSeam(cumulatedEnergyMatrix);

  switch (action) {
    case "REMOVE_SEAM":
      onRemoveSeam({ width, height, data: array }, seam);
      break;
    case "ADD_SEAM":
      onAddSeam({ width, height, data: array }, seam);
      break;

    default:
      break;
  }
});

function onRemoveSeam(
  {
    width,
    height,
    data
  }: { width: number; height: number; data: Uint8ClampedArray },
  seam: Uint32Array
) {
  const newImageData = removeSeam({ data, width, height }, seam);

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

function onAddSeam(
  {
    width,
    height,
    data
  }: { width: number; height: number; data: Uint8ClampedArray },
  seam: Uint32Array
) {
  const newImageData = addSeam({ data, width, height }, seam);

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
