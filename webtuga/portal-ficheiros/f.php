<?php
// Entrega ficheiros do portal Hugo Veiga só com link assinado e dentro do prazo.
declare(strict_types=1);
$cfg = require __DIR__ . '/config.php';

function falhar(int $codigo, string $msg): void { http_response_code($codigo); header('Content-Type: text/plain; charset=utf-8'); echo $msg; exit; }

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origem !== '' && in_array($origem, $cfg['origens'], true)) {
  header('Access-Control-Allow-Origin: ' . $origem);
  header('Vary: Origin');
  header('Access-Control-Allow-Headers: Range');
  header('Access-Control-Expose-Headers: Accept-Ranges, Content-Range, Content-Length, Content-Encoding');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

$a = (string)($_GET['a'] ?? ''); $p = (string)($_GET['p'] ?? ''); $e = (string)($_GET['e'] ?? '');
$d = (string)($_GET['d'] ?? '0'); $n = (string)($_GET['n'] ?? ''); $s = (string)($_GET['s'] ?? '');
$esperada = hash_hmac('sha256', implode('|', [$a, $p, $e, $d, $n]), $cfg['segredo']);
if (!hash_equals($esperada, $s)) falhar(403, 'Link inválido.');
if (!ctype_digit($e) || (int)$e < time()) falhar(410, 'Este link expirou. Volte ao portal e abra o documento de novo.');

$base = realpath($cfg['base']);
if ($base === false) falhar(500, 'Pasta de catálogos não encontrada.');
$alvo = realpath($base . '/' . ltrim($p, '/'));
if ($alvo === false || strpos($alvo, $base . DIRECTORY_SEPARATOR) !== 0 && $alvo !== $base) falhar(404, 'Não encontrado.');

if ($a === 'l') {
  if (!is_dir($alvo)) falhar(404, 'Pasta não encontrada.');
  $lista = [];
  foreach (scandir($alvo) as $f) {
    if ($f[0] === '.' ) continue;
    $c = $alvo . '/' . $f;
    if (is_file($c) && preg_match('/\.(pdf|xlsx|xls|csv)$/i', $f)) $lista[] = ['nome' => $f, 'tamanho' => filesize($c), 'modificado' => filemtime($c)];
  }
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode(['ficheiros' => $lista], JSON_UNESCAPED_UNICODE);
  exit;
}
if ($a !== 'f' || !is_file($alvo)) falhar(404, 'Não encontrado.');

$tipos = ['pdf' => 'application/pdf', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls' => 'application/vnd.ms-excel', 'csv' => 'text/csv'];
$ext = strtolower(pathinfo($alvo, PATHINFO_EXTENSION));
$tamanho = filesize($alvo);
$nome = $n !== '' ? $n : basename($alvo);
$nomeAscii = preg_replace('/[^A-Za-z0-9._ -]/', '_', $nome);

header('Content-Type: ' . ($tipos[$ext] ?? 'application/octet-stream'));
header('Accept-Ranges: bytes');
header('Cache-Control: private, max-age=600');
header('X-Content-Type-Options: nosniff');
header('Content-Disposition: ' . ($d === '1' ? 'attachment' : 'inline') . '; filename="' . $nomeAscii . '"; filename*=UTF-8\'\'' . rawurlencode($nome));

$inicio = 0; $fim = $tamanho - 1;
if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
  if ($m[1] === '' && $m[2] !== '') { $inicio = max(0, $tamanho - (int)$m[2]); }
  else { $inicio = (int)$m[1]; if ($m[2] !== '') $fim = min((int)$m[2], $tamanho - 1); }
  if ($inicio > $fim || $inicio >= $tamanho) { header("Content-Range: bytes */$tamanho"); falhar(416, 'Intervalo inválido.'); }
  http_response_code(206);
  header("Content-Range: bytes $inicio-$fim/$tamanho");
}
header('Content-Length: ' . ($fim - $inicio + 1));
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') exit;

@set_time_limit(0);
while (ob_get_level()) ob_end_clean();
$fh = fopen($alvo, 'rb');
fseek($fh, $inicio);
$falta = $fim - $inicio + 1;
while ($falta > 0 && !feof($fh) && !connection_aborted()) {
  $bloco = fread($fh, (int)min(1048576, $falta));
  echo $bloco; flush();
  $falta -= strlen($bloco);
}
fclose($fh);
