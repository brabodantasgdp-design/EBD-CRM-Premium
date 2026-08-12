export const formatDateToBR = (dateStr?: string): string => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  if (dateStr.includes("-")) {
    const clean = dateStr.split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
  }
  return dateStr;
};

export const formatDateToISO = (dateStr?: string): string => {
  if (!dateStr) {
    return getLocalDateString();
  }
  if (dateStr.includes("-")) {
    return dateStr.split("T")[0];
  }
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return dateStr;
};

export const formatCurrencyBR = (value?: number): string => {
  const val = value || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(val);
};
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getLocalDateTimeISO = (date: Date = new Date()): string => {
  const datePart = getLocalDateString(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${datePart}T${hours}:${minutes}:${seconds}`;
};
