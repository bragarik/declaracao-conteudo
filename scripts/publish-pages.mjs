// SPDX-License-Identifier: GPL-3.0-only
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const remote = process.env.PAGES_REMOTE;
if (!remote) throw new Error('Defina PAGES_REMOTE com o repositório de destino.');
if (!existsSync(resolve(dist, 'index.html'))) throw new Error('Gere o build antes de publicar.');
if (existsSync(resolve(dist, '.git'))) throw new Error('O build não pode conter metadados Git.');

const temporary = mkdtempSync(resolve(tmpdir(), 'declaracao-pages-'));
function git(...args) {
  return execFileSync('git', args, { cwd: temporary, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
try {
  git('init', '-b', 'gh-pages');
  git('config', 'user.name', 'github-actions[bot]');
  git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
  git('remote', 'add', 'origin', remote);
  const existing = git('ls-remote', '--heads', 'origin', 'refs/heads/gh-pages');
  if (existing) {
    git('fetch', '--depth=1', 'origin', 'gh-pages');
    // Mantém a história existente sem copiar os arquivos da publicação anterior.
    git('update-ref', 'refs/heads/gh-pages', 'FETCH_HEAD');
  }
  for (const name of readdirSync(dist)) cpSync(resolve(dist, name), resolve(temporary, name), { recursive: true });
  writeFileSync(resolve(temporary, '.nojekyll'), '');
  git('add', '--all');
  const diff = spawnSync('git', ['diff', '--cached', '--quiet', '--exit-code'], { cwd: temporary });
  if (diff.status === 0) {
    console.log('O conteúdo publicado já está atualizado.');
  } else if (diff.status === 1) {
    git('commit', '-m', 'Publicar site estático');
    git('push', 'origin', 'HEAD:refs/heads/gh-pages');
    console.log('Conteúdo de dist publicado na raiz de gh-pages.');
  } else {
    throw new Error('Não foi possível comparar os arquivos para publicação.');
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
