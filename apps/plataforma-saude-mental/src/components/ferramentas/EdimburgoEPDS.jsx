'use client';

import { useState } from 'react';
import { Baby, Copy, ShieldAlert } from 'lucide-react';

// Escala de Depressao Pos-Natal de Edimburgo (EPDS) — 10 itens, 0-3 cada,
// pontuacao 0-30. Validada para rastreio de depressao perinatal (gestacao
// e puerperio). O item 10 (ideacao de autolesao) exige atencao imediata
// independente da pontuacao total.
const PERGUNTAS = [
  {
    texto: 'Tenho sido capaz de rir e ver o lado engraçado das coisas',
    opcoes: ['Tanto quanto antes', 'Não tanto quanto antes', 'Bem menos que antes', 'Nunca'],
  },
  {
    texto: 'Tenho olhado o futuro com prazer',
    opcoes: ['Tanto quanto sempre olhei', 'Um pouco menos do que costumava', 'Bem menos do que costumava', 'Quase nunca'],
  },
  {
    texto: 'Tenho me culpado sem necessidade quando as coisas saem erradas',
    opcoes: ['Não, nunca', 'Não muitas vezes', 'Sim, algumas vezes', 'Sim, na maioria das vezes'],
  },
  {
    texto: 'Tenho ficado ansiosa ou preocupada sem motivo',
    opcoes: ['Não, de forma alguma', 'Quase nunca', 'Sim, algumas vezes', 'Sim, muitas vezes'],
  },
  {
    texto: 'Tenho sentido medo ou pânico sem ter motivo',
    opcoes: ['Não, nunca', 'Não, não muito', 'Sim, algumas vezes', 'Sim, muitas vezes'],
  },
  {
    texto: 'Tenho sentido que as coisas estão me pressionando ou sobrecarregando',
    opcoes: ['Não, tenho lidado tão bem quanto antes', 'Não, na maior parte do tempo lidei bem', 'Sim, algumas vezes não consegui lidar tão bem', 'Sim, na maior parte do tempo não consegui lidar bem'],
  },
  {
    texto: 'Tenho me sentido tão infeliz que tenho tido dificuldade de dormir',
    opcoes: ['Não, nenhuma vez', 'Não muito frequentemente', 'Sim, algumas vezes', 'Sim, na maioria das vezes'],
  },
  {
    texto: 'Tenho me sentido triste ou arrasada',
    opcoes: ['Não, nunca', 'Não muitas vezes', 'Sim, muitas vezes', 'Sim, quase sempre'],
  },
  {
    texto: 'Tenho me sentido tão infeliz que tenho chorado',
    opcoes: ['Não, nunca', 'Só ocasionalmente', 'Sim, muitas vezes', 'Sim, quase sempre'],
  },
  {
    texto: 'Tive ideias de fazer mal a mim mesma',
    opcoes: ['Nunca', 'Raramente', 'Sim, algumas vezes', 'Sim, muitas vezes'],
  },
];

function classificar(total) {
  if (total < 10) return 'Baixa probabilidade de depressão perinatal';
  if (total < 13) return 'Possível depressão — recomenda-se avaliação clínica complementar';
  return 'Alta probabilidade de depressão perinatal — avaliação clínica prioritária';
}

export default function EdimburgoEPDS() {
  const [respostas, setRespostas] = useState(Array(PERGUNTAS.length).fill(null));
  const [copiado, setCopiado] = useState(false);

  const respondidas = respostas.filter((r) => r !== null);
  const total = respondidas.reduce((a, b) => a + b, 0);
  const completo = respondidas.length === PERGUNTAS.length;
  const classificacao = completo ? classificar(total) : null;
  const riscoItem10 = respostas[9] !== null && respostas[9] > 0;

  const gerarTexto = () =>
    `[EPDS — ESCALA DE DEPRESSÃO PÓS-NATAL DE EDIMBURGO]\nPontuação: ${total}/30 — ${classificacao}.\nItem 10 (ideação de autolesão): ${respostas[9]}/3${riscoItem10 ? ' — POSITIVO, avaliar risco imediatamente' : ''}.\nConduta: Independente da pontuação total, qualquer resposta positiva no item 10 exige avaliação de risco imediata.`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Baby className="w-5 h-5 text-verde" /> EPDS — Escala de Depressão Pós-Natal de Edimburgo
        </h2>
        <p className="text-xs text-slate-500 mb-4">10 itens sobre como a paciente tem se sentido nos últimos 7 dias.</p>
        <div className="space-y-3 text-xs">
          {PERGUNTAS.map((pergunta, idx) => (
            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
              <span className="text-slate-700 font-medium">
                {idx + 1}. {pergunta.texto}
                {idx === 9 && <ShieldAlert className="inline w-3.5 h-3.5 ml-1 text-rose-600" />}
              </span>
              <div className="flex flex-wrap gap-1">
                {pergunta.opcoes.map((label, v) => (
                  <button
                    key={v}
                    onClick={() => {
                      const novo = [...respostas];
                      novo[idx] = v;
                      setRespostas(novo);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      respostas[idx] === v ? 'bg-verde-escuro text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label}
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
          <p className="text-4xl font-black text-verde-escuro mb-2">{completo ? total : '—'}<span className="text-lg text-slate-400">/30</span></p>
          {completo ? (
            <p className="text-sm font-bold text-verde">{classificacao}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">Responda as 10 perguntas para ver o resultado.</p>
          )}
        </div>

        {riscoItem10 && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex gap-2 items-start">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 font-medium">
              Item 10 positivo — avalie risco de autolesão imediatamente, independente da pontuação total.
            </p>
          </div>
        )}

        <div className="bg-verde-escuro text-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span>TEXTO FORMATADO PARA PRONTUÁRIO</span>
            <button onClick={copiar} disabled={!completo} className="text-dourado hover:text-white flex items-center gap-1 text-xs disabled:opacity-40">
              <Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </h3>
          <pre className="text-[11px] bg-black/30 p-3 rounded-xl text-slate-200 font-mono whitespace-pre-wrap border border-white/10">
            {completo ? gerarTexto() : 'Responda todas as perguntas para gerar o texto.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
