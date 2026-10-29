/**
 * Dependências antes do portão (ordem de 28/10/2026): um worktree novo não tem node_modules, e o portão falhava por "ambiente".
 * O publicarBranch roda npm ci sozinho quando falta node_modules (raiz e app).
 * Nunca segue atalho (junção ou link simbólico) para a pasta principal: se o node_modules for atalho, só registra e segue.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Função pura: decide o que fazer em cada pasta com package.json.
function planejarInstalacao(pastas) {
  return pastas.map(({ dir, temPackage, existe, ehLink }) => {
    if (!temPackage) return { dir, acao: 'sem-package' };
    if (ehLink) return { dir, acao: 'pular-link', motivo: 'node_modules é atalho (junção ou link); não sigo para outra pasta' };
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
      ehLink = st.isSymbolicLink();
      // Completa só se o npm terminou (ele grava .package-lock.json ao fim). Pasta parcial de uma instalação interrompida conta como ausente.
      existe = !ehLink && fs.existsSync(path.join(nm, '.package-lock.json'));
    } catch { /* não existe */ }
    return { dir, temPackage: fs.existsSync(path.join(dir, 'package.json')), existe, ehLink };
  });
  const plano = planejarInstalacao(pastas);
  for (const p of plano) {
    if (p.acao !== 'instalar') continue;
    const r = executar('npm', ['ci', '--no-audit', '--no-fund'], { cwd: p.dir, encoding: 'utf8', shell: process.platform === 'win32' });
    if (r.status !== 0) throw new Error(`npm ci falhou em ${p.dir}: ${String(r.stderr || '').trim().slice(0, 200)}`);
    p.acao = 'instalado';
  }
  return plano;
}

module.exports = { planejarInstalacao, prepararDependencias, pastasDoProjeto };
