import { useEffect, useState } from "react";

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 720);
  console.log("isMobile =", isMobile, window.innerWidth);
  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 720);

    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  return isMobile;
}
