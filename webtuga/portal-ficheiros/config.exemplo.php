<?php
// Copiar para config.php e preencher. Este ficheiro NUNCA é servido como texto (é PHP).
return [
  // O mesmo valor de WEBTUGA_SEGREDO na Vercel (texto longo e aleatório)
  'segredo' => 'MUDAR-PARA-UM-SEGREDO-LONGO',
  // Pasta FORA do public_html onde ficam os catálogos: uma subpasta por marca
  'base' => __DIR__ . '/../../catalogos',
  // Sites autorizados a ler os ficheiros pelo browser (capas e Excel)
  'origens' => ['https://www.hugoveiga.pt', 'https://hugoveiga.pt'],
];
