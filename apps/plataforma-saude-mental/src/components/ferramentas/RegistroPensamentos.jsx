'use client';

import React, { useEffect, useState } from 'react';

// Registro de pensamentos automáticos (TCC): gatilho, pensamento, emoção, evidências, pensamento alternativo.
// Os registros ficam SÓ no navegador (localStorage, por visitante). Nada é enviado ao servidor.
const CHAVE = 'drsm:registro-pensamentos';
const LIMITE = 30;

const VAZIO = { gatilho: '', pensamento: '', emocao: '', intensidade: 5, evidenciaFavor: '', evidenciaContra: '', alternativo: '', intensidadeDepois: 3 };

function lerRegistros() {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravarRegistros(lista) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, LIMITE)));
    return true;
  } catch {
    return false;
  }
}

const CAMPOS = [
  { nome: 'gatilho', rotulo: '1. Gatilho: o que aconteceu?', ajuda: 'Situação, lugar ou pessoa. Descreva os fatos.' },
  { nome: 'pensamento', rotulo: '2. Pensamento automático: o que passou pela sua cabeça?', ajuda: 'A frase exata, mesmo que pareça exagerada.' },
  { nome: 'emocao', rotulo: '3. Emoção: o que você sentiu?', ajuda: 'Ex.: medo, vergonha, tristeza. Depois, marque a intensidade abaixo.' },
  { nome: 'evidenciaFavor', rotulo: '4a. Evidências que apoiam o pensamento', ajuda: 'Fatos concretos, não suposições.' },
  { nome: 'evidenciaContra', rotulo: '4b. Evidências que não apoiam o pensamento', ajuda: 'Fatos que contrariam ou relativizam o pensamento.' },
  { nome: 'alternativo', rotulo: '5. Pensamento alternativo, mais equilibrado', ajuda: 'O que você diria a um amigo nessa situação?' },
];

export default function RegistroPensamentos() {
  const [registro, setRegistro] = useState(VAZIO);
  const [registros, setRegistros] = useState([]);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    setRegistros(lerRegistros());
  }, []);

  const pronto = registro.gatilho.trim() && registro.pensamento.trim();

  const salvar = () => {
    const novo = { ...registro, criadoEm: new Date().toISOString() };
    const lista = [novo, ...registros];
    if (gravarRegistros(lista)) {
      setRegistros(lista.slice(0, LIMITE));
      setRegistro(VAZIO);
      setAviso('Registro salvo neste navegador.');
    } else {
      setAviso('Não foi possível salvar neste navegador (armazenamento bloqueado).');
    }
  };

  const apagarTodos = () => {
    try {
      window.localStorage.removeItem(CHAVE);
    } catch {
      // armazenamento indisponível: nada a apagar
    }
    setRegistros([]);
    setAviso('Todos os registros foram apagados deste navegador.');
  };

  return (
    <section aria-labelledby="titulo-registro-pensamentos" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h3 id="titulo-registro-pensamentos" className="text-lg font-bold text-slate-800">Registro de pensamentos (TCC)</h3>
      <p className="text-sm text-slate-600">
        Pensamentos automáticos são rápidos e nem sempre precisos. Anotar a situação, examinar as evidências e formular uma alternativa mais equilibrada ajuda a reduzir o sofrimento.
        Os registros ficam só neste navegador.
      </p>

      {CAMPOS.map((c) => (
        <div key={c.nome} className="space-y-1">
          <label htmlFor={`rp-${c.nome}`} className="block text-sm font-semibold text-slate-800">{c.rotulo}</label>
          <p className="text-xs text-slate-500">{c.ajuda}</p>
          <textarea
            id={`rp-${c.nome}`}
            rows={2}
            maxLength={600}
            value={registro[c.nome]}
            onChange={(e) => setRegistro({ ...registro, [c.nome]: e.target.value })}
            className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado focus-visible:ring-offset-2"
          />
        </div>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-800">
          Intensidade da emoção antes (0 a 10): <strong>{registro.intensidade}</strong>
          <input type="range" min={0} max={10} value={registro.intensidade} onChange={(e) => setRegistro({ ...registro, intensidade: Number(e.target.value) })} className="w-full min-h-[44px]" />
        </label>
        <label className="block text-sm text-slate-800">
          Intensidade depois de reavaliar (0 a 10): <strong>{registro.intensidadeDepois}</strong>
          <input type="range" min={0} max={10} value={registro.intensidadeDepois} onChange={(e) => setRegistro({ ...registro, intensidadeDepois: Number(e.target.value) })} className="w-full min-h-[44px]" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={salvar} disabled={!pronto} className="min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado focus-visible:ring-offset-2  bg-verde-escuro px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Salvar registro
        </button>
        <button type="button" onClick={apagarTodos} disabled={registros.length === 0} className="min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado focus-visible:ring-offset-2  border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">
          Apagar meus registros
        </button>
      </div>
      <p role="status" className="text-sm text-slate-700">{aviso}</p>

      {registros.length > 0 && (
        <p className="text-xs text-slate-500">Você tem {registros.length} registro(s) salvos neste navegador.</p>
      )}
    </section>
  );
}
