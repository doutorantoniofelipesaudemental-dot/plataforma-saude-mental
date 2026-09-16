'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Heart, GraduationCap, Briefcase, Activity, Calendar,
  CheckCircle, AlertTriangle, ShieldAlert, Copy, RefreshCw,
  BookOpen, Smile, Meh, Frown, Sun, Moon, Sparkles, FileText, UserCheck,
  HeartHandshake, Wine, Cookie, Puzzle, Bone, Baby,
} from 'lucide-react';

import ZaritBurden from '@/src/components/ferramentas/ZaritBurden';
import HigieneDoSono from '@/src/components/ferramentas/HigieneDoSono';
import AuditC from '@/src/components/ferramentas/AuditC';
import FomeEmocional from '@/src/components/ferramentas/FomeEmocional';
import SeisCIT from '@/src/components/ferramentas/SeisCIT';
import DorCronica from '@/src/components/ferramentas/DorCronica';
import EdimburgoEPDS from '@/src/components/ferramentas/EdimburgoEPDS';
import PCL5 from '@/src/components/ferramentas/PCL5';
import RespiracaoGuiada from '@/src/components/ferramentas/RespiracaoGuiada';
import useMovimentoReduzido from '@/src/hooks/useMovimentoReduzido';

// Navegacao agrupada por publico/contexto clinico — com 12 abas ao todo,
// uma fila unica de botoes sobrecarregaria a hierarquia visual (Regra 12
// do CLAUDE.md). Cada grupo vira um cluster rotulado dentro do mesmo nav.
const GRUPOS_NAV = [
  {
    titulo: 'Paciente',
    abas: [
      { chave: 'paciente', label: 'Diário & Pacientes', Icone: Heart },
      { chave: 'sono', label: 'Higiene do Sono', Icone: Moon },
      { chave: 'fomeEmocional', label: 'Fome Emocional', Icone: Cookie },
      { chave: 'dorCronica', label: 'Dor Crônica', Icone: Bone },
    ],
  },
  {
    titulo: 'Triagem Clínica',
    abas: [
      { chave: 'medico', label: 'Escalas Clínicas (PA/APS)', Icone: Activity },
      { chave: 'auditC', label: 'AUDIT-C (Álcool)', Icone: Wine },
      { chave: 'pcl5', label: 'PCL-5 (TEPT)', Icone: AlertTriangle },
      { chave: 'edimburgo', label: 'Edimburgo (EPDS)', Icone: Baby },
      { chave: 'zarit', label: 'Zarit (Cuidador)', Icone: HeartHandshake },
      { chave: 'seisCit', label: '6-CIT (Cognição)', Icone: Puzzle },
    ],
  },
  {
    titulo: 'Escola & Trabalho',
    abas: [
      { chave: 'escola', label: 'SNAP-IV (Escolar)', Icone: GraduationCap },
      { chave: 'ocupacional', label: 'Burnout (Ocupacional)', Icone: Briefcase },
    ],
  },
];

const MODULOS_POR_ABA = {
  paciente: () => <ModuloPaciente />,
  medico: () => <ModuloClinico />,
  escola: () => <ModuloEscolar />,
  ocupacional: () => <ModuloOcupacional />,
  zarit: () => <ZaritBurden />,
  sono: () => <HigieneDoSono />,
  auditC: () => <AuditC />,
  fomeEmocional: () => <FomeEmocional />,
  seisCit: () => <SeisCIT />,
  dorCronica: () => <DorCronica />,
  edimburgo: () => <EdimburgoEPDS />,
  pcl5: () => <PCL5 />,
};

// Retemado a partir do .jsx original recebido: mesma logica e estrutura,
// paleta de marca trocada de indigo/gradiente para os tokens reais do
// projeto (verde-escuro/verde/dourado — ver app/globals.css), conforme a
// Regra 1 do CLAUDE.md (proibido gradiente roxo/violeta e sombra
// glassmorphism). Cores semanticas de risco clinico (rosa/ambar/esmeralda)
// foram mantidas: sao codificacao clinica, nao decoracao.

// Regra 8 do CLAUDE.md: transicao de componente 250-400ms, saida ~30% mais
// rapida que a entrada, movimento nasce do estado (nao crossfade que apaga
// contexto). prefers-reduced-motion troca deslocamento por opacidade curta.
function useTransicaoAba() {
  const reduzMovimento = useMovimentoReduzido();
  if (reduzMovimento) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.12 } },
      exit: { opacity: 0, transition: { duration: 0.1 } },
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: 'easeIn' } },
  };
}

export default function SistemaIntegradoSaudeMental() {
  const [activeTab, setActiveTab] = useState('paciente');
  const transicao = useTransicaoAba();
  const ModuloAtivo = MODULOS_POR_ABA[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header / Top Navigation */}
      <header className="bg-verde-escuro text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Plataforma Integrada de Saúde Mental</h1>
              <p className="text-xs text-slate-300">APS · Pronto Atendimento Psiquiátrico · Saúde Ocupacional · Escola</p>
            </div>
          </div>

          {/* Navigation Tabs — agrupadas por publico/contexto clinico */}
          <nav className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
            {GRUPOS_NAV.map((grupo) => (
              <div key={grupo.titulo} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 px-1">
                  {grupo.titulo}
                </span>
                <div className="flex flex-wrap gap-1 bg-black/20 p-1 rounded-xl border border-white/10">
                  {grupo.abas.map(({ chave, label, Icone }) => (
                    <button
                      key={chave}
                      onClick={() => setActiveTab(chave)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activeTab === chave ? 'bg-dourado text-verde-escuro shadow' : 'text-slate-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icone className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={transicao.initial}
            animate={transicao.animate}
            exit={transicao.exit}
          >
            <ModuloAtivo />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* MÓDULO 1: PACIENTES & FAMÍLIAS */
function ModuloPaciente() {
  const [humor, setHumor] = useState(3);
  const [ansiedade, setAnsiedade] = useState(2);
  const [sono, setSono] = useState(7);
  const [notas, setNotas] = useState('');
  const [historico, setHistorico] = useState([]);

  const salvarRegistro = () => {
    const novo = {
      id: Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      humor,
      ansiedade,
      sono,
      notas
    };
    setHistorico([novo, ...historico]);
    setNotas('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" /> Diário de Registro Emocional Diário
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Como está seu humor hoje?</label>
              {/* min-w-0 e obrigatorio aqui: flex-1 sozinho nao deixa o item
                  encolher abaixo da largura intrinseca do conteudo, entao uma
                  palavra sem ponto de quebra ("Excelente") empurrava a fila
                  para fora do card em 400px. break-words da ao texto uma saida
                  quando o botao fica mais estreito que a palavra. Padding e
                  gap reduzidos no mobile abrem a folga que faltava. */}
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {[
                  { v: 1, label: 'Muito Mal', icon: Frown, color: 'text-rose-500' },
                  { v: 2, label: 'Triste', icon: Meh, color: 'text-orange-500' },
                  { v: 3, label: 'Neutro', icon: Smile, color: 'text-amber-500' },
                  { v: 4, label: 'Bem', icon: Smile, color: 'text-emerald-500' },
                  { v: 5, label: 'Excelente', icon: Sparkles, color: 'text-verde' }
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.v}
                      onClick={() => setHumor(item.v)}
                      className={`flex-1 min-w-0 p-2 sm:p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                        humor === item.v ? 'border-verde bg-verde-claro/20 ring-2 ring-verde/20' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <IconComp className={`w-6 h-6 shrink-0 ${item.color}`} />
                      <span className="w-full text-center text-xs font-medium text-slate-600 break-words">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nível de Ansiedade (1 a 5)</label>
                <input
                  type="range" min="1" max="5" value={ansiedade}
                  onChange={(e) => setAnsiedade(Number(e.target.value))}
                  className="w-full accent-verde"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Calmo (1)</span>
                  <span className="font-bold text-verde-escuro">{ansiedade}</span>
                  <span>Intenso (5)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Horas de Sono</label>
                <input
                  type="number" min="0" max="14" value={sono}
                  onChange={(e) => setSono(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Anotações do dia / Gatilhos</label>
              <textarea
                rows="3" value={notas} onChange={(e) => setNotas(e.target.value)}
                placeholder="Ex: Tive reunião estressante à tarde, mas caminhei à noite..."
                className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-verde/20"
              />
            </div>

            <button
              onClick={salvarRegistro}
              className="w-full py-2.5 bg-verde-escuro hover:bg-verde text-white font-medium rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Salvar Registro Diário
            </button>
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" /> Histórico Recente
          </h3>
          {historico.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhum registro armazenado hoje.</p>
          ) : (
            <div className="space-y-2">
              {historico.map((h) => (
                <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-700">{h.data} às {h.hora}</span>
                    <p className="text-slate-600 mt-0.5">Humor: {h.humor}/5 · Ansiedade: {h.ansiedade}/5 · Sono: {h.sono}h</p>
                    {h.notas && <p className="text-slate-500 italic mt-1">&ldquo;{h.notas}&rdquo;</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel Lateral: Psicoeducação & Respiração */}
      <div className="space-y-6">
        <RespiracaoGuiada />

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-verde" /> Guia de Psicoeducação Familiar
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
            <li><strong>Adesão medicamentosa:</strong> Psicotrópicos necessitam de 2 a 4 semanas para início de ação terapêutica plena.</li>
            <li><strong>Higiene do sono:</strong> Evitar telas 1h antes de deitar e manter rotina horária regular.</li>
            <li><strong>Suporte em crises:</strong> Manter postura calma, escuta ativa e evitar julgamentos ou frases de invalidação emocional.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* MÓDULO 2: MÉDICOS E RESIDENTES (PA & APS) */
function ModuloClinico() {
  const [phq9, setPhq9] = useState(Array(9).fill(0));
  const [gad7, setGad7] = useState(Array(7).fill(0));
  const [suicidioRisk, setSuicidioRisk] = useState('nenhum');
  const [copied, setCopied] = useState(false);

  const phq9Total = phq9.reduce((a, b) => a + b, 0);
  const gad7Total = gad7.reduce((a, b) => a + b, 0);

  const getPhqClass = (val) => {
    if (val < 5) return 'Mínima / Ausente';
    if (val < 10) return 'Leve';
    if (val < 15) return 'Moderada';
    if (val < 20) return 'Moderadamente Grave';
    return 'Grave';
  };

  const getGadClass = (val) => {
    if (val < 5) return 'Mínimo';
    if (val < 10) return 'Leve';
    if (val < 15) return 'Moderado';
    return 'Grave';
  };

  const gerarTextoEHR = () => {
    return `[AVALIAÇÃO PSIQUIÁTRICA - APS/PA]
- PHQ-9 (Depressão): Pontuação ${phq9Total}/27 - Classificação: ${getPhqClass(phq9Total)} (Item 9 ideação: ${phq9[8]})
- GAD-7 (Ansiedade): Pontuação ${gad7Total}/21 - Classificação: ${getGadClass(gad7Total)}
- Estratificação de Risco de Suicídio (C-SSRS adaptado): Risco ${suicidioRisk.toUpperCase()}
- Conduta: Mantido plano terapêutico singular, alinhada rede de suporte e orientados sinais de alarme.`;
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(gerarTextoEHR());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* PHQ-9 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-5 h-5 text-verde" /> PHQ-9 (Rastreio de Depressão)</span>
            <span className="text-xs bg-verde-claro/25 text-verde-escuro px-3 py-1 rounded-full font-bold">Total: {phq9Total}/27 ({getPhqClass(phq9Total)})</span>
          </h2>

          <div className="space-y-3 text-xs">
            {[
              "Pouco interesse ou prazer em fazer as coisas",
              "Sentir-se 'para baixo', deprimido(a) ou sem perspectiva",
              "Dificuldade para adormecer, acordar frequentemente ou dormir demais",
              "Sentir cansaço ou falta de energia",
              "Falta de apetite ou comer em excesso",
              "Sentir-se mal consigo mesmo(a), fracassado(a) ou envergonhado(a)",
              "Dificuldade de concentração (ex: ler jornais ou ver TV)",
              "Lentidão ou agitação motora notada por outras pessoas",
              "Pensamentos de se ferir ou de que seria melhor estar morto(a)"
            ].map((q, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-slate-700 font-medium">{idx + 1}. {q}</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        const newArr = [...phq9];
                        newArr[idx] = opt;
                        setPhq9(newArr);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        phq9[idx] === opt ? 'bg-verde-escuro text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GAD-7 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600" /> GAD-7 (Rastreio de Ansiedade)</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">Total: {gad7Total}/21 ({getGadClass(gad7Total)})</span>
          </h2>

          <div className="space-y-3 text-xs">
            {[
              "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
              "Não ser capaz de impedir ou controlar as preocupações",
              "Preocupar-se muito com diversas coisas",
              "Dificuldade para relaxar",
              "Ficar tão agitado(a) que se torna difícil ficar parado(a)",
              "Ficar facilmente irritável ou chateado(a)",
              "Sentir medo como se algo horrível fosse acontecer"
            ].map((q, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-slate-700 font-medium">{idx + 1}. {q}</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        const newArr = [...gad7];
                        newArr[idx] = opt;
                        setGad7(newArr);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        gad7[idx] === opt ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risco de Suicídio & Gerador EHR */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" /> Triagem de Suicídio (PA)
          </h3>
          <div className="space-y-2">
            {[
              { id: 'nenhum', label: 'Sem Risco Evidente', color: 'border-slate-200' },
              { id: 'baixo', label: 'Risco Baixo (Ideação passiva)', color: 'border-amber-300 bg-amber-50/50' },
              { id: 'moderado', label: 'Risco Moderado (Ideação sem plano)', color: 'border-orange-400 bg-orange-50/50' },
              { id: 'alto', label: 'Risco Alto / URGÊNCIA (Plano/Intenção)', color: 'border-rose-500 bg-rose-50/50' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSuicidioRisk(item.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition ${item.color} ${
                  suicidioRisk === item.id ? 'ring-2 ring-rose-500' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gerador de Texto Prontuário */}
        <div className="bg-verde-escuro text-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span>TEXTO FORMATADO PARA E-SUS / EHR</span>
            <button onClick={copiarTexto} className="text-dourado hover:text-white flex items-center gap-1 text-xs">
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </h3>
          <pre className="text-[11px] bg-black/30 p-3 rounded-xl text-slate-200 font-mono whitespace-pre-wrap border border-white/10">
            {gerarTextoEHR()}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* MÓDULO 3: ESCOLAR (SNAP-IV) */
function ModuloEscolar() {
  const [snap, setSnap] = useState(Array(18).fill(0));
  const desatencao = snap.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
  const hiperatividade = snap.slice(9, 18).reduce((a, b) => a + b, 0) / 9;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-verde" /> Rastreio Escolar SNAP-IV (TDAH)</span>
        <div className="flex gap-2 text-xs">
          <span className="bg-verde-claro/25 text-verde-escuro px-3 py-1 rounded-full font-bold">Desatenção: {desatencao.toFixed(2)}</span>
          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold">Hiperatividade: {hiperatividade.toFixed(2)}</span>
        </div>
      </h2>
      <p className="text-xs text-slate-500 mb-4">Pontuação média &gt; 1,8 sugere rastreio positivo que necessita de avaliação médica especializada.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <h3 className="font-bold text-slate-700 mb-2 border-b pb-1">Desatenção (Itens 1 a 9)</h3>
          {[
            "Não presta atenção a detalhes ou comete erros por descuido",
            "Tem dificuldade para manter a atenção em tarefas ou jogos",
            "Parece não escutar quando se fala diretamente com ele(a)",
            "Não segue instruções e não termina deveres ou tarefas",
            "Tem dificuldade para organizar tarefas e atividades",
            "Evita ou reluta em engajar-se em tarefas que exigem esforço mental",
            "Perde coisas necessárias para tarefas ou atividades",
            "Distrai-se facilmente por estímulos alheios à tarefa",
            "Apresenta esquecimento em atividades diárias"
          ].map((q, idx) => (
            <div key={idx} className="p-2 mb-1 bg-slate-50 rounded border flex justify-between items-center gap-1">
              <span className="truncate max-w-[200px]">{idx + 1}. {q}</span>
              <div className="flex gap-1 shrink-0">
                {[0, 1, 2, 3].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      const newArr = [...snap];
                      newArr[idx] = v;
                      setSnap(newArr);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] ${snap[idx] === v ? 'bg-verde-escuro text-white font-bold' : 'bg-white border text-slate-600'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-bold text-slate-700 mb-2 border-b pb-1">Hiperatividade / Impulsividade (Itens 10 a 18)</h3>
          {[
            "Mexe as mãos ou os pés ou se remexe na cadeira",
            "Levanta da cadeira em sala de aula em momentos inadequados",
            "Corre ou escala em demasia em situações inadequadas",
            "Tem dificuldade para jogar ou engajar-se silenciosamente",
            "Está 'a mil' ou muitas vezes age como se estivesse 'movido a motor'",
            "Fala em demasia",
            "Responde precipitadamente antes de as perguntas serem concluídas",
            "Tem dificuldade para aguardar a sua vez",
            "Interrompe ou se intromete em conversas ou jogos alheios"
          ].map((q, idx) => (
            <div key={idx + 9} className="p-2 mb-1 bg-slate-50 rounded border flex justify-between items-center gap-1">
              <span className="truncate max-w-[200px]">{idx + 10}. {q}</span>
              <div className="flex gap-1 shrink-0">
                {[0, 1, 2, 3].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      const newArr = [...snap];
                      newArr[idx + 9] = v;
                      setSnap(newArr);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] ${snap[idx + 9] === v ? 'bg-amber-600 text-white font-bold' : 'bg-white border text-slate-600'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* MÓDULO 4: SAÚDE OCUPACIONAL & BURNOUT */
function ModuloOcupacional() {
  const [exaustao, setExaustao] = useState(3);
  const [cinismo, setCinismo] = useState(2);
  const [eficacia, setEficacia] = useState(4);

  const getRiscoOcupacional = () => {
    if (exaustao >= 4 && cinismo >= 3) return { label: 'ALTO RISCO DE BURNOUT', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (exaustao >= 3) return { label: 'RISCO MODERADO (ESTRESSE ELEVADO)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'RISCO BAIXO', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const risco = getRiscoOcupacional();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-verde" /> Rastreio de Saúde Ocupacional & Burnout (MBI)
          </h2>
          <p className="text-xs text-slate-500">Avaliação das dimensões psicossociais no ambiente de trabalho.</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${risco.color}`}>
          {risco.label}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="font-bold text-slate-700 block">1. Exaustão Emocional (1 a 5)</label>
          <input type="range" min="1" max="5" value={exaustao} onChange={(e) => setExaustao(Number(e.target.value))} className="w-full accent-verde" />
          <p className="text-slate-500">Sensação de esgotamento físico e emocional pelo trabalho diário.</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="font-bold text-slate-700 block">2. Despersonalização / Cinismo (1 a 5)</label>
          <input type="range" min="1" max="5" value={cinismo} onChange={(e) => setCinismo(Number(e.target.value))} className="w-full accent-verde" />
          <p className="text-slate-500">Distanciamento afetivo e endurecimento de atitudes com colegas ou usuários.</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="font-bold text-slate-700 block">3. Eficácia Profissional (1 a 5)</label>
          <input type="range" min="1" max="5" value={eficacia} onChange={(e) => setEficacia(Number(e.target.value))} className="w-full accent-verde" />
          <p className="text-slate-500">Sensação de competência e realização pessoal no trabalho (Inverso).</p>
        </div>
      </div>
    </div>
  );
}
