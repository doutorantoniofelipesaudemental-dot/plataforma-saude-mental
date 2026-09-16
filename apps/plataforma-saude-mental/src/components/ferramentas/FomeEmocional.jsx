'use client';

import { useState } from 'react';
import { Cookie, Copy } from 'lucide-react';

// Rastreio de fome emocional — questionario de triagem inspirado nos
// dominios da subescala de "restrained/emotional eating" (ex.: DEBQ), sem
// reproduzir um instrumento validado especifico item a item. Util para
// abrir a conversa clinica sobre a relacao entre comida e emocao.
const ITENS = [
  'Tenho vontade de comer quando estou ansioso(a), mesmo sem fome física.',
  'Como para me acalmar quando estou triste ou estressado(a).',
  'Depois de comer por impulso emocional, sinto culpa ou vergonha.',
  'Como rapidamente e em grande quantidade, sentindo que perco o controle.',
  'Prefiro comer sozinho(a) quando estou emocionalmente abalado(a), para não ser visto(a).',
  'Uso a comida como recompensa depois de um dia difícil.',
  'Sinto que a comida é uma das poucas formas de aliviar o que estou sentindo.',
];

const OPCOES = [
  { v: 0, label: 'Nunca' },
  { v: 1, label: 'Raramente' },
  { v: 2, label: 'Às vezes' },
  { v: 3, label: 'Frequentemente' },
  { v: 4, label: 'Sempre' },
];

function classificar(total) {
  if (total <= 6) return 'Baixa associação entre comida e regulação emocional';
  if (total <= 16) return 'Associação moderada — vale investigar padrão alimentar';
  return 'Associação forte — sugestivo de compulsão alimentar ligada à emoção';
}

export default function FomeEmocional() {
  const [respostas, setRespostas] = useState(Array(ITENS.length).fill(0));
  const [copiado, setCopiado] = useState(false);

  const total = respostas.reduce((a, b) => a + b, 0);
  const classificacao = classificar(total);

  const gerarTexto = () =>
    `[RASTREIO DE FOME EMOCIONAL / COMPULSÃO ALIMENTAR]\nPontuação: ${total}/28 — ${classificacao}.\nConduta: Investigar frequência e contexto dos episódios, sinais de perda de controle e culpa associada; considerar encaminhamento nutricional e psicológico conjunto.`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Cookie className="w-5 h-5 text-verde" /> Rastreio de Fome Emocional
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Ferramenta de triagem clínica — não é escala validada única, mas ajuda a abrir a conversa sobre comida e emoção.
        </p>
        <div className="space-y-3 text-xs">
          {ITENS.map((pergunta, idx) => (
            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
              <span className="text-slate-700 font-medium">{idx + 1}. {pergunta}</span>
              <div className="flex flex-wrap gap-1">
                {OPCOES.map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => {
                      const novo = [...respostas];
                      novo[idx] = opt.v;
                      setRespostas(novo);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      respostas[idx] === opt.v ? 'bg-verde-escuro text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">Pontuação total</p>
          <p className="text-4xl font-black text-verde-escuro mb-2">{total}<span className="text-lg text-slate-400">/28</span></p>
          <p className="text-sm font-bold text-verde">{classificacao}</p>
        </div>

        <div className="bg-verde-escuro text-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span>TEXTO FORMATADO PARA PRONTUÁRIO</span>
            <button onClick={copiar} className="text-dourado hover:text-white flex items-center gap-1 text-xs">
              <Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </h3>
          <pre className="text-[11px] bg-black/30 p-3 rounded-xl text-slate-200 font-mono whitespace-pre-wrap border border-white/10">
            {gerarTexto()}
          </pre>
        </div>
      </div>
    </div>
  );
}
