'use client';

import { useState } from 'react';
import { Bone, Copy } from 'lucide-react';

// Avaliacao de dor cronica — inspirada nos dois blocos centrais do Brief
// Pain Inventory (intensidade da dor e interferencia funcional), numa
// versao pratica de 0-10 por item, sem reproduzir o instrumento
// proprietario na integra.
const INTENSIDADE = [
  { chave: 'pior', label: 'Pior dor nas últimas 24h' },
  { chave: 'media', label: 'Dor média nas últimas 24h' },
  { chave: 'agora', label: 'Dor neste momento' },
];

const INTERFERENCIA = [
  { chave: 'atividadeGeral', label: 'Atividade geral do dia a dia' },
  { chave: 'humor', label: 'Humor' },
  { chave: 'caminhar', label: 'Capacidade de caminhar' },
  { chave: 'trabalho', label: 'Trabalho (dentro ou fora de casa)' },
  { chave: 'relacoes', label: 'Relações com outras pessoas' },
  { chave: 'sono', label: 'Sono' },
  { chave: 'prazer', label: 'Prazer em viver' },
];

function classificarInterferencia(media) {
  if (media <= 3) return 'Interferência funcional leve';
  if (media <= 6) return 'Interferência funcional moderada';
  return 'Interferência funcional severa';
}

function Slider({ label, valor, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-verde-escuro">{valor}/10</span>
      </div>
      <input type="range" min="0" max="10" value={valor} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-verde" />
    </div>
  );
}

export default function DorCronica() {
  const [intensidade, setIntensidade] = useState({ pior: 5, media: 5, agora: 5 });
  const [interferencia, setInterferencia] = useState(
    Object.fromEntries(INTERFERENCIA.map((i) => [i.chave, 5]))
  );
  const [copiado, setCopiado] = useState(false);

  const mediaIntensidade = (
    (intensidade.pior + intensidade.media + intensidade.agora) / 3
  ).toFixed(1);
  const valoresInterferencia = Object.values(interferencia);
  const mediaInterferencia = (
    valoresInterferencia.reduce((a, b) => a + b, 0) / valoresInterferencia.length
  ).toFixed(1);
  const classificacao = classificarInterferencia(Number(mediaInterferencia));

  const gerarTexto = () =>
    `[AVALIAÇÃO DE DOR CRÔNICA]\nIntensidade — pior: ${intensidade.pior}/10, média: ${intensidade.media}/10, agora: ${intensidade.agora}/10 (média geral: ${mediaIntensidade}/10).\nInterferência funcional média: ${mediaInterferencia}/10 — ${classificacao}.\nConduta: Considerar impacto psicológico da dor crônica no plano terapêutico, não apenas o controle analgésico isolado.`;

  const copiar = () => {
    navigator.clipboard.writeText(gerarTexto());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Bone className="w-5 h-5 text-verde" /> Avaliação de Dor Crônica
          </h2>
          <p className="text-xs text-slate-500 mb-4">Intensidade da dor nas últimas 24 horas, de 0 (sem dor) a 10 (pior dor imaginável).</p>
          <div className="space-y-4">
            {INTENSIDADE.map((item) => (
              <Slider
                key={item.chave}
                label={item.label}
                valor={intensidade[item.chave]}
                onChange={(v) => setIntensidade({ ...intensidade, [item.chave]: v })}
              />
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Interferência da dor no dia a dia (0 = não interfere, 10 = interfere totalmente)</h3>
          <div className="space-y-4">
            {INTERFERENCIA.map((item) => (
              <Slider
                key={item.chave}
                label={item.label}
                valor={interferencia[item.chave]}
                onChange={(v) => setInterferencia({ ...interferencia, [item.chave]: v })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">Intensidade média</p>
          <p className="text-3xl font-black text-verde-escuro mb-3">{mediaIntensidade}<span className="text-base text-slate-400">/10</span></p>
          <p className="text-xs font-semibold text-slate-500 mb-1">Interferência funcional média</p>
          <p className="text-3xl font-black text-verde-escuro mb-2">{mediaInterferencia}<span className="text-base text-slate-400">/10</span></p>
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
