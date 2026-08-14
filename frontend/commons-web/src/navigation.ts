import { useEffect, useState } from "react";

export function useHashPath(): string {
  const [path, setPath] = useState(() => readHashPath());

  useEffect(() => {
    function hashChanged() {
      setPath(readHashPath());
    }

    window.addEventListener("hashchange", hashChanged);
    return () => window.removeEventListener("hashchange", hashChanged);
  }, []);

  return path;
}

export function navigate(path: string) {
  window.location.hash = path;
}

function readHashPath(): string {
  return window.location.hash.slice(1) || "/profile";
}
