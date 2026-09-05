/**
 * QUV-Lab — Service d'Export & Impression de Rapports et Données
 */

export function downloadTextFile(filename: string, text: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  downloadTextFile(filename, json, 'application/json;charset=utf-8');
}

export function printElementById(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Impression optimisée pour le conteneur du rapport
  window.print();
}
