'use client';

import { useState } from 'react';
import { Puzzle, Copy } from 'lucide-react';

// 6-CIT (Six-Item Cognitive Impairment Test, versao Kingshill 2000) —
// rastreio cognitivo breve, aplicado pelo entrevistador (nao e
// autopreenchivel pelo paciente, ja que ele nao pode ver as respostas
// certas). Pontuacao 0-28, quanto maior, pior.
const ITENS_SIM_NAO = [
  { chave: 'ano', texto: 'Pergunte: em que ano estamos?', pesoErro: 4 },
  { chave: 'mes', texto: 'Pergunte: em que mês estamos?', pesoErro: 3 },
  { chave: 'hora', texto: 'Pergunte (sem olhar relógio): que horas são aproximadamente? (tolerância de 1h)', pesoErro: 3 },
];

const ITENS_ERROS = [
  { chave: 'contagem', texto: 'Peça para contar de 20 a 1, de trás para frente.' },
  { chave: 'meses', texto: 'Peça para dizer os meses do ano em ordem reversa (dezembro, novembro...).' },
];

const OPCOES_ERRO = [
  { v: 0, label: 'Sem erros' },
  { v: 2, label: '1 erro' },
  { v: 4, label: 'Mais de 1 erro' },
];

const OPCOES_MEMORIA = [
  { v: 0, label: 'Lembrou tudo' },
  { v: 2, label: 'Errou 1 elemento' },
  { v: 4, label: 'Errou 2 elementos' },
  { v: 6, label: 'Errou 3 elementos' },
  { v: 8, label: 'Errou 4 elementos' },
  { v: 10, label: 'Não lembrou nada / não tentou' },
];

function classificar(total) {
  if (total <= 7) return 'Sem sugestão de comprometimento cognitivo significativo';
  if (total <= 9) return 'Limítrofe — considerar avaliação neuropsicológica complementar';
  return 'Sugestivo de comprometimento cognitivo significativo';
}

export default function SeisCIT() {
  const [simNao, setSimNao] = useState({ ano: null, mes: null, hora: null });
  const [erros, setErros] = useState({ contagem: null, meses: null });
  const [memoria, setMemoria] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const valores = [...Object.values(simNao), ...Object.values(erros), memoria];
  const completo = valores.every((v) => v !== null);
  const total = completo ? valores.reduce((a, b) => a + b, 0) : 0;
  const classificacao = completo ? classificar(total) : null;

  const gerarTexto = () =>
    `[6-CIT — RASTREIO COGNITIVO BREVE]\nPontuação: ${total}/28 (quanto maior, pior) — ${classificacao}.\nConduta: Rastreio positivo justifica avaliação neuropsicológica formal e investigação de causas reversíveis (polifarmácia, depressão, distúrbios metabólicos).`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-verde" /> 6-CIT — Rastreio Cognitivo Breve
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Aplicado pelo entrevistador — registre o desempenho do paciente em cada tarefa, não peça para ele mesmo marcar.
        </p>

        <div className="mb-4 p-3 bg-verde-claro/15 rounded-xl border border-verde/20 text-xs text-tinta-media">
          <strong className="text-verde-escuro">Antes de começar:</strong> peça ao paciente para memorizar este
          nome e endereço, avisando que perguntará novamente ao final — <em>"João Santos, Rua das Palmeiras, 42, Bairro Jardim"</em>.
        </div>

        <div className="space-y-3 text-xs mb-4">
          {ITENS_SIM_NAO.map((item) => (
            <div key={item.chave} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
              <span className="text-slate-700 font-medium">{item.texto}</span>
              <div className="flex gap-1">
                {[{ v: 0, label: 'Correto' }, { v: item.pesoErro, label: 'Incorreto' }].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setSimNao({ ...simNao, [item.chave]: opt.v })}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      simNao[item.chave] === opt.v ? 'bg-verde-escuro text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {ITENS_ERROS.map((item) => (
            <div key={item.chave} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
              <span className="text-slate-700 font-medium">{item.texto}</span>
              <div className="flex flex-wrap gap-1">
                {OPCOES_ERRO.map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setErros({ ...erros, [item.chave]: opt.v })}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      erros[item.chave] === opt.v ? 'bg-verde-escuro text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
            <span className="text-slate-700 font-medium">Agora peça para repetir o nome e endereço memorizados no início.</span>
            <div className="flex flex-wrap gap-1">
              {OPCOES_MEMORIA.map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setMemoria(opt.v)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                    memoria === opt.v ? 'bg-verde-escuro text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">Pontuação total</p>
          <p className="text-4xl font-black text-verde-escuro mb-2">{completo ? total : '—'}<span className="text-lg text-slate-400">/28</span></p>
          {completo ? (
            <p className="text-sm font-bold text-verde">{classificacao}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">Complete os 6 itens para ver o resultado.</p>
          )}
        </div>

        <div className="bg-verde-escuro text-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span>TEXTO FORMATADO PARA PRONTUÁRIO</span>
            <button onClick={copiar} disabled={!completo} className="text-dourado hover:text-white flex items-center gap-1 text-xs disabled:opacity-40">
              <Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </h3>
          <pre className="text-[11px] bg-black/30 p-3 rounded-xl text-slate-200 font-mono whitespace-pre-wrap border border-white/10">
            {completo ? gerarTexto() : 'Complete os 6 itens para gerar o texto.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
