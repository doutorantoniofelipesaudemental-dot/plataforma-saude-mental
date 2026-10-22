'use client';

import React, { useState } from 'react';

// Inscrição opcional para receber a rotina personalizada por e-mail. Envia SOMENTE e-mail e consentimento:
// nenhuma resposta do quiz nem do diário sai deste navegador. Não bloqueia o uso da ferramenta.
export default function EmailOptIn() {
  const [email, setEmail] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot: campo oculto, humanos não preenchem
  const [estado, setEstado] = useState({ tipo: 'parado', mensagem: '' });

  const enviar = async (evento) => {
    evento.preventDefault();
    setEstado({ tipo: 'enviando', mensagem: 'Enviando…' });
    try {
      const resp = await fetch('/api/captura-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consentimento, website }),
      });
      const corpo = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setEstado({ tipo: 'ok', mensagem: 'Pronto! Você receberá a rotina no seu e-mail.' });
        setEmail('');
        setConsentimento(false);
      } else if (resp.status === 503) {
        setEstado({ tipo: 'indisponivel', mensagem: corpo.erro || 'Envio temporariamente indisponível. Tente mais tarde.' });
      } else {
        setEstado({ tipo: 'erro', mensagem: corpo.erro || 'Não foi possível concluir agora. Tente de novo.' });
      }
    } catch {
      setEstado({ tipo: 'erro', mensagem: 'Sem conexão no momento. Tente de novo em instantes.' });
    }
  };

  return (
    <section aria-labelledby="titulo-email-optin" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
      <h3 id="titulo-email-optin" className="text-sm font-bold text-slate-800">Receber a rotina por e-mail (opcional)</h3>
      <p className="text-xs text-slate-600">
        Recebe um guia prático de respiração e de registro de pensamentos. Suas respostas e seu diário ficam só neste navegador.
      </p>

      <form onSubmit={enviar} className="space-y-3">
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>
            Não preencha este campo
            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        <label htmlFor="optin-email" className="block text-sm text-slate-800">E-mail</label>
        <input
          id="optin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-h-[44px] rounded-lg border border-slate-300 p-2 text-sm text-slate-900"
        />

        <label className="flex min-h-[44px] items-start gap-2 text-xs text-slate-800">
          <input type="checkbox" required checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} className="mt-1 h-5 w-5" />
          <span>
            Concordo em receber, por e-mail, a rotina e os materiais do Portal, conforme a{' '}
            <a href="/privacidade" className="underline">Política de Privacidade</a> (LGPD). Posso cancelar a qualquer momento.
          </span>
        </label>

        <button type="submit" disabled={!consentimento || estado.tipo === 'enviando'} className="min-h-[44px] rounded-lg bg-verde-escuro px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Quero receber
        </button>
      </form>

      <p role="status" className="text-xs text-slate-700">{estado.mensagem}</p>
    </section>
  );
}
