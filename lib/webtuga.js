import 'server-only';
import crypto from 'node:crypto';

// Links temporários para ficheiros guardados no alojamento Webtuga (ver webtuga/portal-ficheiros/f.php)
const base = () => process.env.WEBTUGA_FICHEIROS_URL;
const segredo = () => {
  const s = process.env.WEBTUGA_SEGREDO;
  if (!s || !base()) throw new Error('Falta configurar WEBTUGA_FICHEIROS_URL e WEBTUGA_SEGREDO.');
  return s;
};
const assinatura = (partes) => crypto.createHmac('sha256', segredo()).update(partes.join('|')).digest('hex');

export function linkFicheiro(path, { segundos = 600, descarregar = false, nome = '' } = {}) {
  const e = Math.floor(Date.now() / 1000) + segundos;
  const d = descarregar ? '1' : '0';
  const s = assinatura(['f', path, e, d, nome]);
  const q = new URLSearchParams({ a: 'f', p: path, e: String(e), d, n: nome, s });
  return `${base()}?${q}`;
}

export async function listarPasta(pasta) {
  const e = Math.floor(Date.now() / 1000) + 60;
  const s = assinatura(['l', pasta, e, '0', '']);
  const q = new URLSearchParams({ a: 'l', p: pasta, e: String(e), d: '0', n: '', s });
  const r = await fetch(`${base()}?${q}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Alojamento respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).ficheiros || [];
}
