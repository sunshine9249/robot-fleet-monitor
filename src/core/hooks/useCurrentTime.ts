import { useEffect, useState } from "react";
import moment from "moment";

export function useCurrentTime(format: string = "YYYY.MM.DD HH:mm:ss") {
  const [currentTime, setCurrentTime] = useState(moment().format(format));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format(format));
    }, 1000);

    return () => clearInterval(timer);
  }, [format]);

  return currentTime;
}
