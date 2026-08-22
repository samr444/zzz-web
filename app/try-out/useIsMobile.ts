import { useEffect, useState } from "react";

export default function useIsMobile(breakpoint = 720): boolean {
  // Starts false on every render pass (server AND the client's first
  // render) so hydration never disagrees on this — the effect below
  // corrects it to the real value immediately after mount.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);

    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, [breakpoint]);

  return isMobile;
}