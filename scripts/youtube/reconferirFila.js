/**
 * Reconfere os itens "aprovado-checagem" da fila com o conferidor oficial (ordem de 23/10/2026).
 *  - Aprovados pelo conferidor: mantêm o status, com hash do vídeo conferido e a checagem gravada.
 *  - Reprovados: status 'reprovado', cópia dos quadros e motivos em relatorios/youtube/reprovados/<id>/,
 *    e id incluído em REGERAR-FILA.txt (a regeração noturna lê essa lista).
 * Dry-run por padrão (só mostra o resultado). Com --aplicar: backup da fila (SHA-256) e gravação.
 * A publicação continua travada pelo freio do YouTube. Não publica nada.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const L = require('./lib');
const { conferirVideo, statusPelaConferencia } = require('./conferirVideo');
const regeracao = require('./regeracao');

const APLICAR = process.argv.includes('--aplicar');
const ARQ_FILA = path.join(L.REL, 'fila.json');
const ARQ_REGERAR = path.join(L.REL, 'REGERAR-FILA.txt');

function backupFila(raw) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const dir = path.join(L.RAIZ, 'backups', `fila-youtube-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'fila.json'), raw, 'utf8');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  fs.writeFileSync(path.join(dir, 'SHA256.txt'), `${hash}  fila.json\n`, 'utf8');
  return { dir, hash };
}

async function main() {
  const raw = fs.readFileSync(ARQ_FILA, 'utf8');
  const fila = JSON.parse(raw);
  const alvo = fila.itens.filter((i) => i.status === 'aprovado-checagem');
  const resultado = { total: alvo.length, aprovados: [], reprovados: [] };

  for (const it of alvo) {
    const dir = path.join(L.RAIZ, it.pasta);
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
    meta.checagemTexto = L.checarTexto(meta); // reconfere com a regra atual, como o montarFila (o meta guarda o resultado antigo)
    const conf = await conferirVideo(dir, meta);
    const calculado = statusPelaConferencia(conf, meta);
    const status = regeracao.statusComGate(it.id, calculado, regeracao.lerEstado().itens);
    it.hashVideo = meta.hashVideo;
    it.checagem = { ...(it.checagem || {}), video: conf.falhas };
    if (status === 'aprovado-checagem') {
      resultado.aprovados.push(it.id);
      continue;
    }
    it.status = status;
    resultado.reprovados.push({ id: it.id, motivos: conf.falhas, status });
    if (APLICAR) {
      const rep = path.join(L.REL, 'reprovados', it.id);
      fs.mkdirSync(rep, { recursive: true });
      for (const f of ['ini', 'meio', 'fim']) {
        const o = path.join(dir, 'conferencia', `${f}.png`);
        if (fs.existsSync(o)) fs.copyFileSync(o, path.join(rep, `${f}.png`));
      }
      fs.writeFileSync(path.join(rep, 'motivos.txt'), [it.id, ...conf.falhas, `Pasta do vídeo: ${it.pasta}`].join('\n') + '\n', 'utf8');
    }
  }

  console.log(JSON.stringify({ modo: APLICAR ? 'aplicar' : 'dry-run', total: resultado.total, aprovados: resultado.aprovados.length, reprovados: resultado.reprovados.length, detalhe: resultado.reprovados }, null, 1));

  if (!APLICAR) return;
  const b = backupFila(raw);
  fs.writeFileSync(ARQ_FILA, JSON.stringify(fila, null, 1), 'utf8');
  const novos = resultado.reprovados.map((r) => r.id);
  const atuais = fs.existsSync(ARQ_REGERAR) ? fs.readFileSync(ARQ_REGERAR, 'utf8').split(/\r?\n/).filter(Boolean) : [];
  fs.writeFileSync(ARQ_REGERAR, [...new Set([...atuais, ...novos])].join('\n') + '\n', 'utf8');
  console.log(`GRAVADO · backup ${b.dir} · sha256 ${b.hash} · reprovados enviados à regeração: ${novos.length}`);
}

main().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
