
export function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-'); // yyyy-mm-dd
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
}
