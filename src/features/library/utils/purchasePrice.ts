/** Empty means unknown, zero means free. Match the persisted decimal(18,2) precision. */
export function parsePurchasePrice(text: string): number | null {
  const value = text.trim();
  if (!value) return null;
  if (!/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(value)) {
    throw new Error("Invalid purchase price");
  }
  const price = Number(value.replace(",", "."));
  if (!Number.isFinite(price) || price >= 1e16) throw new Error("Invalid purchase price");
  return price;
}
