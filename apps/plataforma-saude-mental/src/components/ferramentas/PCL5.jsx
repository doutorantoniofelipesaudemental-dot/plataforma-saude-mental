'use client';

import { useState } from 'react';
import { AlertTriangle, Copy } from 'lucide-react';

// PCL-5 (PTSD Checklist for DSM-5) — 20 itens cobrindo os 4 clusters de
// sintomas do TEPT no DSM-5 (intrusao, evitacao, alteracoes negativas de
// cognicao/humor, hiperativacao). Escala 0-4 por item, pontuacao 0-80.
const ITENS = [
  'Lembranças repetidas, perturbadoras e involuntárias do evento estressante.',
  'Sonhos repetidos e perturbadores relacionados ao evento.',
  'De repente sentir ou agir como se o evento estivesse acontecendo de novo (flashback).',
  'Sentir-se muito chateado(a) quando algo lembra o evento.',
  'Reações físicas fortes (coração acelerado, falta de ar, suor) quando algo lembra o evento.',
  'Evitar lembranças, pensamentos ou sentimentos relacionados ao evento.',
  'Evitar coisas externas que lembrem o evento (pessoas, lugares, conversas, atividades, objetos).',
  'Dificuldade para lembrar partes importantes do evento estressante.',
  'Crenças negativas fortes sobre si mesmo, outras pessoas ou o mundo.',
  'Culpar a si mesmo(a) ou outra pessoa pelo evento ou pelo que aconteceu depois.',
  'Sentimentos negativos fortes como medo, horror, raiva, culpa ou vergonha.',
  'Perda de interesse em atividades que costumava gostar.',
  'Sentir-se distante ou afastado(a) das outras pessoas.',
  'Dificuldade para sentir emoções positivas (felicidade, satisfação, amor).',
  'Comportamento irritado, explosões de raiva ou agressividade.',
  'Assumir riscos excessivos ou fazer coisas que poderiam machucar você.',
  'Estar "em alerta", vigilante ou cauteloso o tempo todo.',
  'Sentir-se facilmente sobressaltado(a) ou assustado(a).',
  'Dificuldade de concentração.',
  'Dificuldade para dormir ou permanecer dormindo.',
];

const OPCOES = [
  { v: 0, label: 'Nada' },
  { v: 1, label: 'Um pouco' },
  { v: 2, label: 'Moderadamente' },
  { v: 3, label: 'Bastante' },
  { v: 4, label: 'Extremamente' },
];

function classificar(total) {
  if (total < 31) return 'Abaixo do ponto de corte para TEPT provável';
  return 'Sugestivo de TEPT provável — avaliação clínica formal indicada';
}

export default function PCL5() {
  const [respostas, setRespostas] = useState(Array(ITENS.length).fill(0));
  const [copiado, setCopiado] = useState(false);

  const total = respostas.reduce((a, b) => a + b, 0);
  const classificacao = classificar(total);

  const gerarTexto = () =>
    `[PCL-5 — CHECKLIST DE TEPT PARA DSM-5]\nPontuação: ${total}/80 (ponto de corte ≈31-33) — ${classificacao}.\nConduta: Pontuação acima do corte não fecha diagnóstico isoladamente — indica avaliação clínica estruturada para TEPT.`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-verde" /> PCL-5 — Checklist de TEPT (DSM-5)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Nas últimas 4 semanas, o quanto cada problema abaixo incomodou o paciente por causa de um evento estressante vivido.
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
          <p className="text-4xl font-black text-verde-escuro mb-2">{total}<span className="text-lg text-slate-400">/80</span></p>
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
