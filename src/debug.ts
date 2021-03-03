import DEBUG from "debug";
import { sep } from "path";

export { DEBUG };
export const Debug = (...flags: string[]) => {
  const relativePathDif: string[] = flags;
  try {
    throw new Error("pretty fancy huh");
  } catch (err) {
    const callerLine = (err as Error).stack?.split("\n")[2];
    const callingFile = /\((.*):\d+:\d+\)/.exec(`${callerLine}`);
    if (callingFile) {
      relativePathDif.push(
        ...callingFile[1]
          .replace(__dirname, "")
          .split(sep)
          .filter(seg => !!seg)
          .map(seg => (seg.includes(".") ? seg.split(".")[0] : seg))
      );
    }
  }
  return DEBUG(relativePathDif.join(":"));
};
