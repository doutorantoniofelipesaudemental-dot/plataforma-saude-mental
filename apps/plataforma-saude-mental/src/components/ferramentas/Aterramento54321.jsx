'use client';

import React, { useState } from 'react';

// Aterramento 5-4-3-2-1 (grounding): traz a atenção para o presente em passos curtos. Não guarda nenhuma resposta.
const PASSOS = [
  { quantidade: 5, sentido: 'coisas que você vê', instrucao: 'Olhe ao redor e nomeie, em voz baixa ou mentalmente, 5 coisas que você vê.' },
  { quantidade: 4, sentido: 'coisas que você pode tocar', instrucao: 'Note 4 coisas que você consegue tocar (a roupa, a cadeira, a superfície sob as mãos).' },
  { quantidade: 3, sentido: 'sons que você ouve', instrucao: 'Escute com atenção e identifique 3 sons, perto ou longe.' },
  { quantidade: 2, sentido: 'cheiros que você percebe', instrucao: 'Perceba 2 cheiros, ou lembre-se de 2 cheiros agradáveis.' },
  { quantidade: 1, sentido: 'gosto que você sente', instrucao: 'Observe 1 gosto na boca, ou beba um pouco de água devagar.' },
];

export default function Aterramento54321() {
  const [passo, setPasso] = useState(0);
  const concluido = passo >= PASSOS.length;

  return (
    <section aria-labelledby="titulo-aterramento" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h3 id="titulo-aterramento" className="text-lg font-bold text-slate-800">Aterramento 5-4-3-2-1</h3>
      <p className="text-sm text-slate-600">
        Um exercício curto para desacelerar em momentos de ansiedade intensa. Vá no seu ritmo; nada é gravado.
      </p>

      {!concluido ? (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm font-semibold text-slate-800">Passo {passo + 1} de {PASSOS.length}: {PASSOS[passo].quantidade} {PASSOS[passo].sentido}</p>
          <p className="text-sm text-slate-700">{PASSOS[passo].instrucao}</p>
          <button type="button" onClick={() => setPasso(passo + 1)} className="min-h-[44px] rounded-lg bg-verde-escuro px-4 py-2 text-sm font-semibold text-white">
            Feito, próximo passo
          </button>
        </div>
      ) : (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm text-slate-800">Respire devagar algumas vezes e perceba como você está agora.</p>
          <p className="text-sm text-slate-700">Se a angústia não passar, ou se você estiver em crise, procure apoio: <strong>CVV 188</strong> (24 h, gratuito) ou <strong>SAMU 192</strong>.</p>
          <button type="button" onClick={() => setPasso(0)} className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">
            Recomeçar
          </button>
        </div>
      )}
    </section>
  );
}
