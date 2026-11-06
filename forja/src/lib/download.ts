export function downloadText(name: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Usa a folha de compartilhamento do iOS quando disponível (salvar em Arquivos). */
export async function shareOrDownload(name: string, text: string, type = 'application/json') {
  try {
    const file = new File([text], name, { type });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.canShare?.({ files: [file] }) && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch {
    /* cancelado ou sem suporte: cai no download */
  }
  downloadText(name, text, type);
}
