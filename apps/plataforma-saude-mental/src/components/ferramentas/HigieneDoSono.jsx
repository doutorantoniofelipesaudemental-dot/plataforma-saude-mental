'use client';

import { useState } from 'react';
import { Moon, Copy } from 'lucide-react';

// Questionario de habitos de sono — rastreio de higiene do sono inspirado
// nos dominios do Sleep Hygiene Index (horario, cafeina/alcool, telas,
// ambiente, cochilos, exercicio). NAO e a reproducao literal de um
// instrumento validado especifico: e uma ferramenta de triagem clinica
// util para orientar a conversa sobre habitos de sono.
const ITENS = [
  'Vou dormir e acordo em horários muito diferentes de um dia para o outro.',
  'Uso o celular, tablet ou TV na cama, pouco antes de dormir.',
  'Consumo cafeína (café, refrigerante, energético) nas 6 horas antes de dormir.',
  'Consumo álcool como forma de "relaxar" para dormir.',
  'Cochilo durante o dia por mais de 30 minutos, ou cochilo tarde da tarde.',
  'Fico na cama acordado(a) por muito tempo tentando dormir, sem conseguir.',
  'Faço exercício físico intenso perto do horário de dormir.',
  'Meu quarto está barulhento, muito iluminado ou com temperatura desconfortável na hora de dormir.',
  'Penso em problemas do dia ou do trabalho quando estou na cama.',
  'Uso a cama para trabalhar, comer ou assistir TV, além de dormir.',
];

const OPCOES = [
  { v: 0, label: 'Nunca' },
  { v: 1, label: 'Raramente' },
  { v: 2, label: 'Às vezes' },
  { v: 3, label: 'Frequentemente' },
  { v: 4, label: 'Sempre' },
];

function classificar(total) {
  if (total <= 8) return 'Boa higiene do sono';
  if (total <= 16) return 'Higiene do sono com pontos de atenção';
  return 'Higiene do sono comprometida';
}

export default function HigieneDoSono() {
  const [respostas, setRespostas] = useState(Array(ITENS.length).fill(0));
  const [copiado, setCopiado] = useState(false);

  const total = respostas.reduce((a, b) => a + b, 0);
  const classificacao = classificar(total);

  const gerarTexto = () =>
    `[RASTREIO DE HIGIENE DO SONO]\nPontuação: ${total}/40 (maior = mais hábitos que atrapalham o sono) — ${classificacao}.\nConduta: Orientar sobre horário regular de sono, redução de telas e cafeína/álcool à noite, e reservar a cama só para dormir.`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Moon className="w-5 h-5 text-verde" /> Questionário de Hábitos de Sono
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Rastreio de higiene do sono — quanto maior a frequência de cada hábito abaixo, mais ele tende a atrapalhar o sono.
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
          <p className="text-4xl font-black text-verde-escuro mb-2">{total}<span className="text-lg text-slate-400">/40</span></p>
          <p className="text-sm font-bold text-verde">{classificacao}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Orientações práticas</h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
            <li>Manter horário fixo de dormir e acordar, inclusive nos fins de semana.</li>
            <li>Evitar telas na cama — a luz e o estímulo dificultam o início do sono.</li>
            <li>Reservar a cama só para dormir, não para trabalhar ou comer.</li>
          </ul>
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
