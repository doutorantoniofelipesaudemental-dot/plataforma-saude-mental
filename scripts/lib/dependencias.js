/**
 * Dependências antes do portão (ordem de 28/10/2026): um worktree novo não tem node_modules, e o portão falhava por "ambiente".
 * O publicarBranch roda npm ci sozinho quando falta node_modules (raiz e app).
 * Nunca segue atalho (junção ou link simbólico) para a pasta principal. Atalho em node_modules é ERRO CLARO (ordem de 31/10/2026):
 * o publicador não segue, não apaga nada e explica o que fazer (remover só a junção e rodar npm ci nesse worktree).
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const MENSAGEM_LINK = (dir) => `node_modules em ${dir} é junção ou link (atalho para a pasta principal). Remova só o atalho (rmdir, sem /S, nunca o destino) e rode npm ci nesta pasta.`;

// Função pura: decide o que fazer em cada pasta com package.json.
function planejarInstalacao(pastas) {
  return pastas.map(({ dir, temPackage, existe, ehLink }) => {
    if (!temPackage) return { dir, acao: 'sem-package' };
    if (ehLink) return { dir, acao: 'erro-link', motivo: MENSAGEM_LINK(dir) };
    if (existe) return { dir, acao: 'ok' };
    return { dir, acao: 'instalar' };
  });
}

// Pastas que o portão usa: a raiz e o app Next.
function pastasDoProjeto(raiz) {
  return [raiz, path.join(raiz, 'apps', 'plataforma-saude-mental')];
}

// Coleta o estado real de cada pasta e executa o npm ci onde falta node_modules. Lança erro se o npm ci falhar.
function prepararDependencias(raiz, executar = spawnSync) {
  const pastas = pastasDoProjeto(raiz).map((dir) => {
    const nm = path.join(dir, 'node_modules');
    let existe = false;
    let ehLink = false;
    try {
      const st = fs.lstatSync(nm);
      existe = true;
      ehLink = st.isSymbolicLink();
    } catch { /* não existe */ }
    return { dir, temPackage: fs.existsSync(path.join(dir, 'package.json')), existe, ehLink };
  });
  const plano = planejarInstalacao(pastas);
  const erros = plano.filter((p) => p.acao === 'erro-link');
  if (erros.length) throw new Error(erros.map((p) => p.motivo).join(' | '));
  for (const p of plano) {
    if (p.acao !== 'instalar') continue;
    const r = executar('npm', ['ci', '--no-audit', '--no-fund'], { cwd: p.dir, encoding: 'utf8', shell: process.platform === 'win32' });
    if (r.status !== 0) throw new Error(`npm ci falhou em ${p.dir}: ${String(r.stderr || '').trim().slice(0, 200)}`);
    p.acao = 'instalado';
  }
  return plano;
}

module.exports = { planejarInstalacao, prepararDependencias, pastasDoProjeto };
