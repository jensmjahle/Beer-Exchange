export function useAssetUrl() {
  const base =
    window.env?.VITE_API_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000";

  function assetUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  }

  return { assetUrl };
}
