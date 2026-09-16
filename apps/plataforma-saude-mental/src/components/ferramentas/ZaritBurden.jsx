'use client';

import { useState } from 'react';
import { HeartHandshake, Copy } from 'lucide-react';

// Escala de Sobrecarga do Cuidador de Zarit (Zarit Burden Interview), versao
// de 22 itens — instrumento padrao para rastreio de sobrecarga em
// cuidadores familiares. Escala Likert 0-4 por item (Nunca a Quase sempre),
// pontuacao total 0-88.
const ITENS = [
  'Sente que, por causa do tempo que dedica ao seu familiar, não tem tempo suficiente para você mesmo(a)?',
  'Sente-se estressado(a) entre cuidar do seu familiar e dar conta de outras responsabilidades (trabalho, família)?',
  'Sente-se irritado(a) quando está perto do seu familiar?',
  'Sente que a situação atual afeta negativamente sua relação com outros familiares ou amigos?',
  'Sente-se receoso(a) pelo futuro do seu familiar?',
  'Sente que seu familiar depende de você?',
  'Sente-se tenso(a) quando está perto do seu familiar?',
  'Sente que sua saúde foi afetada por causa do cuidado que oferece?',
  'Sente que não tem tanta privacidade quanto gostaria, por causa do seu familiar?',
  'Sente que sua vida social foi prejudicada por cuidar do seu familiar?',
  'Sente-se incomodado(a) em ter amigos em casa, por causa do seu familiar?',
  'Sente que seu familiar espera que você cuide dele(a), como se você fosse a única pessoa de quem ele(a) pode depender?',
  'Sente que não tem dinheiro suficiente para cuidar do seu familiar, somado às suas outras despesas?',
  'Sente que será incapaz de cuidar do seu familiar por muito mais tempo?',
  'Sente que perdeu o controle da sua vida desde a doença do seu familiar?',
  'Gostaria de simplesmente deixar que outra pessoa cuidasse do seu familiar?',
  'Sente-se em dúvida sobre o que fazer pelo seu familiar?',
  'Sente que deveria estar fazendo mais pelo seu familiar?',
  'Sente que poderia cuidar melhor do seu familiar?',
  'De um modo geral, o quanto se sente sobrecarregado(a) por cuidar do seu familiar?',
  'Sente que o cuidado prejudicou seu equilíbrio emocional?',
  'Sente vergonha por causa do comportamento do seu familiar?',
];

const OPCOES = [
  { v: 0, label: 'Nunca' },
  { v: 1, label: 'Raramente' },
  { v: 2, label: 'Algumas vezes' },
  { v: 3, label: 'Frequentemente' },
  { v: 4, label: 'Quase sempre' },
];

function classificar(total) {
  if (total <= 20) return 'Pouca ou nenhuma sobrecarga';
  if (total <= 40) return 'Sobrecarga leve a moderada';
  if (total <= 60) return 'Sobrecarga moderada a severa';
  return 'Sobrecarga severa';
}

export default function ZaritBurden() {
  const [respostas, setRespostas] = useState(Array(ITENS.length).fill(0));
  const [copiado, setCopiado] = useState(false);

  const total = respostas.reduce((a, b) => a + b, 0);
  const classificacao = classificar(total);

  const gerarTexto = () =>
    `[ESCALA DE ZARIT — SOBRECARGA DO CUIDADOR]\nPontuação: ${total}/88 — Classificação: ${classificacao}.\nConduta: Avaliar rede de apoio ao cuidador, orientar divisão de tarefas e considerar encaminhamento para suporte psicológico próprio.`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-verde" /> Escala de Zarit — Sobrecarga do Cuidador
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          22 itens, escala de 0 (nunca) a 4 (quase sempre). Responda pensando na experiência do cuidador nas últimas semanas.
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
          <p className="text-4xl font-black text-verde-escuro mb-2">{total}<span className="text-lg text-slate-400">/88</span></p>
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
