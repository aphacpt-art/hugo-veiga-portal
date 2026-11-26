# Instalar na Webtuga (uma vez)

1. No Gestor de Ficheiros do cPanel, criar a pasta `catalogos` ao lado de `public_html` (fora dela) e, dentro, uma subpasta por marca (ex.: `catalogos/marca-x`).
2. Copiar a pasta `portal-ficheiros` para dentro de `public_html` (fica em `https://hugoveiga.pt/portal-ficheiros/f.php`).
3. Copiar `config.exemplo.php` para `config.php` e pôr o mesmo segredo que está na Vercel (`WEBTUGA_SEGREDO`).
4. Na Vercel: `WEBTUGA_FICHEIROS_URL=https://hugoveiga.pt/portal-ficheiros/f.php` e `WEBTUGA_SEGREDO=<o mesmo segredo>`.
5. No back-office > Empresas, indicar em cada marca o nome da subpasta. Depois, em Documentos, usar "Sincronizar pastas".
