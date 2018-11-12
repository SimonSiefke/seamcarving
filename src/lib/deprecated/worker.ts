// /**
//  * Computes an image data object that visualizes the seams as red pixels.
//  * @param param0
//  * @param smallSeams
//  */
// function onShowSmallSeams(
//   {
//     width,
//     height,
//     data
//   }: { width: number; height: number; data: Uint8ClampedArray },
//   smallSeams: Uint32Array[]
// ) {
//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       if (
//         smallSeams.find(
//           seam => seam[Math.floor(y / factor)] === Math.floor(x / factor)
//         )
//       ) {
//         const index = (y * width + x) * 4;
//         data[index] = 255;
//         data[index + 1] = 0;
//         data[index + 2] = 0;
//         data[index + 3] = 255;
//       }
//     }
//   }
//   self.postMessage(
//     {
//       action: "SHOW_SEAMS",
//       data: {
//         buffer: data.buffer,
//         width,
//         height
//       }
//     },
//     // @ts-ignore
//     [data.buffer]
//   );
// }

// /**
//  * Computes an image data object width n seams are removed for each given seam.
//  * @param param0
//  * @param seams - the seams to remove
//  */
// function onRemoveNSeamsFrom1(
//   {
//     width,
//     height,
//     data
//   }: { width: number; height: number; data: Uint8ClampedArray },
//   seams: Uint32Array[]
// ) {
//   const newImageData = removeNSeamsFrom1(
//     {
//       width,
//       height,
//       data
//     },
//     seams,
//     factor
//   );
//   self.postMessage(
//     {
//       action: "REMOVE_2_SEAMS_FROM_1",
//       data: {
//         buffer: newImageData.data.buffer,
//         width: newImageData.width,
//         height: newImageData.height
//       }
//     },
//     // @ts-ignore
//     [data.buffer]
//   );
// }
