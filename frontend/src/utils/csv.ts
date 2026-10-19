function toCsvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function downloadCsv(
  filename: string,
  header: string[],
  rows: (string | number)[][],
) {
  // Ponto e vírgula e BOM para o Excel em português abrir com as colunas e acentos certos
  const csv = [header, ...rows]
    .map((row) => row.map(toCsvCell).join(';'))
    .join('\n');
  const url = URL.createObjectURL(
    new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
