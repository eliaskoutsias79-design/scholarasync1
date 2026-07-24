export const toSafeHttpUrl = (value) => {
  const candidate = String(value || "").trim();
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : "";
  } catch {
    return "";
  }
};
