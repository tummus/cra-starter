import Dimensions from "types/Dimensions";

export default async function getImageDimensions(
  dataUri: string
): Promise<Dimensions> {
  return new Promise((resolved) => {
    const i = new Image();
    i.onload = function () {
      resolved({ width: i.width, height: i.height });
    };
    i.src = dataUri;
  });
}
