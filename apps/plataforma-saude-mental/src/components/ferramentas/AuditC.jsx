'use client';

import { useState } from 'react';
import { Wine, Copy } from 'lucide-react';

// AUDIT-C — versao curta de 3 itens do AUDIT (Alcohol Use Disorders
// Identification Test), instrumento validado da OMS para rastreio de uso
// de risco de alcool em atencao primaria. Pontuacao 0-12.
const PERGUNTAS = [
  {
    texto: 'Com que frequência você consome bebidas alcoólicas?',
    opcoes: [
      { v: 0, label: 'Nunca' },
      { v: 1, label: 'Mensalmente ou menos' },
      { v: 2, label: '2 a 4 vezes por mês' },
      { v: 3, label: '2 a 3 vezes por semana' },
      { v: 4, label: '4 ou mais vezes por semana' },
    ],
  },
  {
    texto: 'Quantas doses de álcool você consome num dia típico em que bebe?',
    opcoes: [
      { v: 0, label: '1 ou 2' },
      { v: 1, label: '3 ou 4' },
      { v: 2, label: '5 ou 6' },
      { v: 3, label: '7 a 9' },
      { v: 4, label: '10 ou mais' },
    ],
  },
  {
    texto: 'Com que frequência você consome 6 ou mais doses em uma única ocasião?',
    opcoes: [
      { v: 0, label: 'Nunca' },
      { v: 1, label: 'Menos que mensalmente' },
      { v: 2, label: 'Mensalmente' },
      { v: 3, label: 'Semanalmente' },
      { v: 4, label: 'Diariamente ou quase todo dia' },
    ],
  },
];

function classificar(total, sexo) {
  const corte = sexo === 'feminino' ? 3 : 4;
  if (total >= corte) return 'Positivo para uso de risco — investigar padrão de consumo';
  return 'Negativo para uso de risco pelo ponto de corte';
}

export default function AuditC() {
  const [respostas, setRespostas] = useState(Array(PERGUNTAS.length).fill(null));
  const [sexo, setSexo] = useState('masculino');
  const [copiado, setCopiado] = useState(false);

  const respondidas = respostas.filter((r) => r !== null);
  const total = respondidas.reduce((a, b) => a + b, 0);
  const completo = respondidas.length === PERGUNTAS.length;
  const classificacao = completo ? classificar(total, sexo) : null;

  const gerarTexto = () =>
    `[AUDIT-C — RASTREIO DE USO DE RISCO DE ÁLCOOL]\nPontuação: ${total}/12 (ponto de corte: ${sexo === 'feminino' ? '≥3' : '≥4'}) — ${classificacao}.\nConduta: Em caso positivo, aprofundar investigação com AUDIT completo e orientar sobre padrão de consumo de baixo risco.`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Wine className="w-5 h-5 text-verde" /> AUDIT-C — Rastreio de Uso de Risco de Álcool
        </h2>
        <p className="text-xs text-slate-500 mb-4">Versão curta de 3 perguntas do AUDIT (OMS), validada para Atenção Primária.</p>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Sexo (ponto de corte é diferente)</label>
          <div className="flex gap-2">
            {['masculino', 'feminino'].map((s) => (
              <button
                key={s}
                onClick={() => setSexo(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  sexo === s ? 'bg-verde-escuro text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {PERGUNTAS.map((pergunta, idx) => (
            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
              <span className="text-slate-700 font-medium">{idx + 1}. {pergunta.texto}</span>
              <div className="flex flex-wrap gap-1">
                {pergunta.opcoes.map((opt) => (
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
          <p className="text-4xl font-black text-verde-escuro mb-2">{total}<span className="text-lg text-slate-400">/12</span></p>
          {completo ? (
            <p className="text-sm font-bold text-verde">{classificacao}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">Responda as 3 perguntas para ver o resultado.</p>
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
            {completo ? gerarTexto() : 'Responda todas as perguntas para gerar o texto.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
