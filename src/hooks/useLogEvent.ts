import AmplitudeEvent from "types/enums/AmplitudeEvent";
import { Callback } from "amplitude-js";
import getAmplitude from "utils/amplitude/getAmplitude";

export default function useLogEvent(): (
  event: AmplitudeEvent,
  data?: { [key: string]: any },
  callback?: Callback
) => void {
  return (event, data, callback) => {
    const amplitude = getAmplitude();
    amplitude.logEvent(
      event,
      {
        ...data,
        location: window.location,
        origin: window.self.origin,
        referrer: document.referrer,
      },
      callback
    );
  };
}
