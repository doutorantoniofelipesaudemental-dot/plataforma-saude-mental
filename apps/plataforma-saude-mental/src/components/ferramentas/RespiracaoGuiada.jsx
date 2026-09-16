'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';

import useMovimentoReduzido from '@/src/hooks/useMovimentoReduzido';

// Exercicio de respiracao 4-7-8 (Andrew Weil): 4s inspirando pelo nariz,
// 7s de retencao, 8s expirando pela boca. A expiracao prolongada em relacao
// a inspiracao e o que sustenta a tecnica — por isso a esfera leva o dobro
// do tempo para encolher do que levou para crescer, e a animacao nunca e
// acelerada para "caber" melhor na tela.
const FASES = [
  {
    chave: 'inspirar',
    rotulo: 'Inspire...',
    apoio: 'pelo nariz, sem forçar o ombro',
    resumo: '4s inspira',
    segundos: 4,
  },
  {
    chave: 'segurar',
    rotulo: 'Segure...',
    apoio: 'mantenha o ar, mandíbula solta',
    resumo: '7s segura',
    segundos: 7,
  },
  {
    chave: 'expirar',
    rotulo: 'Expire...',
    apoio: 'pela boca, em fio contínuo',
    resumo: '8s expira',
    segundos: 8,
  },
];

const ESCALA_MIN = 0.5;
const ESCALA_MAX = 1;

// Escala alvo de cada fase: cresce na inspiracao, para na retencao, reduz na
// expiracao. Indexado na mesma ordem de FASES.
const ESCALA_POR_FASE = [
  { de: ESCALA_MIN, para: ESCALA_MAX },
  { de: ESCALA_MAX, para: ESCALA_MAX },
  { de: ESCALA_MAX, para: ESCALA_MIN },
];

// Curva senoidal (easeInOutSine). O volume pulmonar nao varia de forma
// linear: o fluxo acelera no meio do movimento e desacelera nas pontas.
// Regra 3 do CLAUDE.md tambem proibe `linear` em movimento desta natureza.
const suavizar = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

// Regra 3 do CLAUDE.md: mola natural para micro-interacao de controle.
const MOLA = { type: 'spring', stiffness: 300, damping: 30 };

// Regra 8: entrada 250-400ms, saida ~30% mais rapida.
const TROCA_TEXTO = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.19, ease: 'easeIn' } },
};

const TROCA_TEXTO_REDUZIDA = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const CICLOS_SUGERIDOS = 4;

export default function RespiracaoGuiada() {
  const reduzMovimento = useMovimentoReduzido();

  const [ativo, setAtivo] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [faseIdx, setFaseIdx] = useState(0);
  const [restante, setRestante] = useState(FASES[0].segundos);
  const [ciclos, setCiclos] = useState(0);

  // O relogio vive em refs para que o loop de animacao nao dependa de estado
  // React — assim pausar/retomar preserva o tempo decorrido da fase atual e
  // o loop nao e recriado a cada troca de fase.
  const faseRef = useRef(0);
  const decorridoRef = useRef(0);
  const restanteRef = useRef(FASES[0].segundos);

  const escala = useMotionValue(ESCALA_MIN);
  const progresso = useMotionValue(0);
  // O halo acompanha a expansao: pulmao cheio, luz mais presente. Um unico
  // momento de encanto por tela (Regra 9), e ele reforca a propria respiracao.
  const brilhoHalo = useTransform(escala, [ESCALA_MIN, ESCALA_MAX], [0.16, 0.46]);

  const fase = FASES[faseIdx];

  const reiniciar = useCallback(() => {
    setAtivo(false);
    setIniciado(false);
    setFaseIdx(0);
    setCiclos(0);
    setRestante(FASES[0].segundos);
    faseRef.current = 0;
    decorridoRef.current = 0;
    restanteRef.current = FASES[0].segundos;
    escala.set(ESCALA_MIN);
    progresso.set(0);
  }, [escala, progresso]);

  const alternar = () => {
    setAtivo((anterior) => !anterior);
    setIniciado(true);
  };

  useEffect(() => {
    if (!ativo) return undefined;

    let frame;
    let anterior = performance.now();

    const passo = (agora) => {
      // Aba em segundo plano congela o rAF: sem o teto de 1s, o retorno
      // avancaria varios ciclos de uma vez. Perder o tempo em que o usuario
      // nao estava olhando e o comportamento correto para o exercicio.
      const delta = Math.min(agora - anterior, 1000);
      anterior = agora;
      decorridoRef.current += delta;

      let atual = FASES[faseRef.current];
      while (decorridoRef.current >= atual.segundos * 1000) {
        decorridoRef.current -= atual.segundos * 1000;
        const proxima = (faseRef.current + 1) % FASES.length;
        faseRef.current = proxima;
        if (proxima === 0) setCiclos((c) => c + 1);
        setFaseIdx(proxima);
        atual = FASES[proxima];
      }

      const duracao = atual.segundos * 1000;
      const t = decorridoRef.current / duracao;
      progresso.set(t);

      if (!reduzMovimento) {
        const alvo = ESCALA_POR_FASE[faseRef.current];
        escala.set(alvo.de + (alvo.para - alvo.de) * suavizar(t));
      }

      const segundos = Math.max(1, Math.ceil(atual.segundos - decorridoRef.current / 1000));
      if (restanteRef.current !== segundos) {
        restanteRef.current = segundos;
        setRestante(segundos);
      }

      frame = requestAnimationFrame(passo);
    };

    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [ativo, reduzMovimento, escala, progresso]);

  // Sair da aba pausa o exercicio: contar respiracao de alguem que nao esta
  // na tela produziria um numero falso quando ela voltasse.
  useEffect(() => {
    const aoTrocarVisibilidade = () => {
      if (document.hidden) setAtivo(false);
    };
    document.addEventListener('visibilitychange', aoTrocarVisibilidade);
    return () => document.removeEventListener('visibilitychange', aoTrocarVisibilidade);
  }, []);

  // Sob prefers-reduced-motion a esfera nao desloca; o feedback migra para
  // opacidade curta e para o anel/contador (Regra 8: reduzir movimento,
  // nunca remover feedback).
  useEffect(() => {
    if (reduzMovimento) escala.set(0.84);
  }, [reduzMovimento, escala]);

  const trocaTexto = reduzMovimento ? TROCA_TEXTO_REDUZIDA : TROCA_TEXTO;
  const rotuloAtual = iniciado ? fase.rotulo : 'Pronto para começar';
  const apoioAtual = ativo
    ? fase.apoio
    : iniciado
      ? 'Exercício pausado — retome quando quiser'
      : 'Sente-se apoiado e solte os ombros antes de iniciar';

  return (
    <div className="bg-verde-escuro text-white p-6 rounded-2xl shadow-md">
      <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
        <Wind className="w-4 h-4 text-dourado" /> Respiração guiada 4-7-8
      </h3>
      <p className="text-xs text-slate-300 mb-6 leading-relaxed">
        Quatro segundos inspirando, sete de retenção, oito expirando. A expiração longa é o que
        desacelera a frequência cardíaca — acompanhe a esfera no seu ritmo, sem forçar.
      </p>

      {/* Esfera + anel contador. Todo o bloco visual e decorativo para leitores
          de tela: o estado real e anunciado pelo texto abaixo, em aria-live. */}
      <div className="relative mx-auto h-56 w-56" aria-hidden="true">
        <motion.div
          className="absolute inset-8 rounded-full blur-2xl"
          style={{
            scale: escala,
            opacity: brilhoHalo,
            background:
              'radial-gradient(circle, var(--color-verde-claro) 0%, var(--color-azul-calmo) 70%, transparent 100%)',
          }}
        />

        <motion.div
          className="absolute inset-8 rounded-full"
          style={{
            scale: escala,
            background:
              'radial-gradient(circle at 32% 26%, var(--color-azul-claro) 0%, var(--color-verde-claro) 52%, var(--color-azul-calmo) 100%)',
            boxShadow: 'inset 0 -12px 28px color-mix(in srgb, var(--color-verde) 45%, transparent)',
          }}
        />

        <svg viewBox="0 0 224 224" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="112"
            cy="112"
            r="104"
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="5"
          />
          <motion.circle
            cx="112"
            cy="112"
            r="104"
            fill="none"
            stroke="var(--color-dourado)"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ pathLength: progresso }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-black tabular-nums text-verde-escuro">
            {iniciado ? restante : FASES[0].segundos}
          </span>
        </div>
      </div>

      {/* Rotulo e linha de apoio trocam juntos, no mesmo no do AnimatePresence:
          separados, o `mode="wait"` segurava o rotulo antigo por ~190ms de
          saida enquanto o apoio ja tinha virado — o usuario lia "Segure..."
          sobre "pela boca". A instrucao e o produto aqui. */}
      <div className="mt-6 min-h-16 text-center" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${rotuloAtual}|${apoioAtual}`}
            initial={trocaTexto.initial}
            animate={trocaTexto.animate}
            exit={trocaTexto.exit}
          >
            <p className="text-2xl font-extrabold text-dourado">{rotuloAtual}</p>
            <p className="mt-1 text-xs text-slate-300">{apoioAtual}</p>
            {/* O contador visual esta em aria-hidden: anuncia-lo a cada segundo
                seria ruido. A duracao da fase entra aqui, uma vez por troca. */}
            <span className="sr-only">{ativo ? `${fase.segundos} segundos` : ''}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Trilha 4-7-8: indica a fase ativa e ensina a proporcao da tecnica na
          largura de cada faixa. Quem marca o tempo dentro da fase e o anel —
          duas linhas do tempo animadas em paralelo dessincronizariam. */}
      <div className="mt-6 flex items-end gap-1" aria-hidden="true">
        {FASES.map((item, idx) => (
          <div key={item.chave} className="flex flex-col gap-1.5" style={{ flexGrow: item.segundos, flexBasis: 0 }}>
            <motion.div
              className="h-1 rounded-full bg-dourado"
              initial={false}
              animate={{ opacity: iniciado && idx === faseIdx ? 1 : 0.22 }}
              transition={{ duration: reduzMovimento ? 0.12 : 0.2, ease: 'easeOut' }}
            />
            {/* A fase inativa muda de cor, nao de opacidade: texto de 10px
                rebaixado por alpha nao sustenta o contraste AA da Regra 2.
                Troca de cor por token, via transicao CSS — interpolar `var()`
                em motion value nao funciona. */}
            <span
              className={`text-center text-[10px] font-semibold uppercase tracking-wide transition-colors duration-200 ${
                iniciado && idx === faseIdx ? 'text-dourado' : 'text-slate-300'
              }`}
            >
              {item.resumo}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <motion.button
          type="button"
          onClick={alternar}
          whileHover={reduzMovimento ? undefined : { scale: 1.02 }}
          whileTap={reduzMovimento ? undefined : { scale: 0.98 }}
          transition={MOLA}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-verde px-4 text-sm font-semibold text-white transition-colors hover:bg-verde-claro hover:text-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado focus-visible:ring-offset-2 focus-visible:ring-offset-verde-escuro"
        >
          {ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {ativo ? 'Pausar' : iniciado ? 'Retomar' : 'Iniciar respiração'}
        </motion.button>

        <AnimatePresence initial={false}>
          {iniciado && (
            <motion.button
              type="button"
              onClick={reiniciar}
              initial={reduzMovimento ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={reduzMovimento ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduzMovimento ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={reduzMovimento ? { duration: 0.12 } : MOLA}
              whileTap={reduzMovimento ? undefined : { scale: 0.95 }}
              aria-label="Reiniciar o exercício de respiração"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-slate-300 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado focus-visible:ring-offset-2 focus-visible:ring-offset-verde-escuro"
            >
              <RotateCcw className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-300">
        {ciclos > 0
          ? `${ciclos} ${ciclos === 1 ? 'ciclo completo' : 'ciclos completos'} · ${CICLOS_SUGERIDOS} é a prática habitual`
          : `A prática habitual são ${CICLOS_SUGERIDOS} ciclos seguidos`}
      </p>
    </div>
  );
}
