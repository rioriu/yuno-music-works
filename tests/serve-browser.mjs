// Local-only fault injection. No source data is modified and no requests are proxied.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const failed = new Set();
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const port = Number(process.argv[2] || 8766);
createServer(async (request,response) => {
  try {
    const url = new URL(request.url,'http://localhost');
    const match = url.pathname.match(/^\/__check\/(404|invalid|network|storage|empty)\//);
    const mode = match?.[1];
    const pathname = match ? url.pathname.slice(match[0].length) : url.pathname.slice(1);
    let file = path.resolve(root,decodeURIComponent(pathname));
    if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file,'index.html');
    response.setHeader('Cache-Control','no-store');
    response.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
    const key = `${mode}:${file}`;
    if (mode && file.endsWith('.json') && !failed.has(key)) {
      failed.add(key);
      if (mode === '404') { response.writeHead(404).end(); return; }
      if (mode === 'invalid') { response.end('{invalid'); return; }
      if (mode === 'network') { response.destroy(); return; }
      if (mode === 'empty') { response.end('[]'); return; }
    }
    let content = await readFile(file);
    if (mode === 'storage' && file.endsWith(`${path.sep}app.js`)) {
      content = `Object.defineProperty(window,'localStorage',{get(){throw new Error('Test: storage denied');}});\n${content}`;
    }
    response.end(content);
  } catch { response.writeHead(404).end(); }
}).listen(port,'127.0.0.1',() => console.log(`Browser checks: http://127.0.0.1:${port}/ (faults: /__check/404/, /__check/invalid/, /__check/network/, /__check/storage/, /__check/empty/)`));
