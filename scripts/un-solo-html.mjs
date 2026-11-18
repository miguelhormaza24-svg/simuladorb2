// Empaqueta el sitio compilado en un único archivo HTML autocontenido.
// Uso: npm run build:html  →  genera simulador-b2.html en la raíz del proyecto.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const salida = process.argv[2] ?? 'simulador-b2.html';
const dir = mkdtempSync(join(tmpdir(), 'b2-'));
try {
  execFileSync('npx', ['vite', 'build', '--base', './', '--outDir', dir, '--emptyOutDir'], { stdio: 'inherit' });
  const assets = join(dir, 'assets');
  const archivos = readdirSync(assets);
  const css = archivos.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
  const js = archivos.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n')
    .replace(/<\/script/gi, '<\\/script');
  let html = readFileSync(join(dir, 'index.html'), 'utf8')
    .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>\s*/g, '')
    .replace(/<link[^>]*rel="stylesheet"[^>]*>\s*/g, '');
  // Función como reemplazo: el código minificado trae secuencias «$&» y «$'» que replace interpretaría.
  html = html.replace('</head>', () => `<style>\n${css}\n</style>\n</head>`);
  html = html.replace('</body>', () => `<script type="module">\n${js}\n</script>\n</body>`);
  writeFileSync(salida, html);
  console.log(`Generado ${salida} (${(Buffer.byteLength(html) / 1024).toFixed(0)} kB)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
