'use client';
// Gera uma imagem JPEG da 1.ª página de um PDF, no browser
export async function gerarCapaPdf(ficheiro, largura = 600) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await ficheiro.arrayBuffer() }).promise;
  const pagina = await pdf.getPage(1);
  const v1 = pagina.getViewport({ scale: 1 });
  const viewport = pagina.getViewport({ scale: largura / v1.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
  await pagina.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
  await pdf.destroy();
  return await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
}
