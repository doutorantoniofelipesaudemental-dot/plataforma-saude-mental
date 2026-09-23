/* =========================================================================
   Página inicial: artigos recentes + formulário de agendamento.
   ========================================================================= */
(function () {
  'use strict';

  const { api, cartaoArtigo, estadoVazio } = window.Site;

  /* -------------------------- Artigos recentes -------------------------- */

  async function carregarArtigos() {
    const alvo = document.getElementById('artigos-recentes');
    if (!alvo) return;

    try {
      const dados = await api('/artigos?limite=3');
      alvo.setAttribute('aria-busy', 'false');

      if (!dados.itens || dados.itens.length === 0) {
        alvo.innerHTML = estadoVazio(
          'Nenhum artigo publicado ainda',
          'Em breve teremos conteúdo novo por aqui.'
        );
        return;
      }
      alvo.innerHTML = dados.itens.map(cartaoArtigo).join('');
    } catch (err) {
      alvo.setAttribute('aria-busy', 'false');
      alvo.innerHTML = estadoVazio(
        'Não foi possível carregar os artigos',
        'Tente recarregar a página em alguns instantes.'
      );
      console.warn('[artigos]', err.message);
    }
  }

  /* --------------------------- Agendamento ------------------------------ */

  const formulario = document.getElementById('formulario-agendamento');
  if (!formulario) return void carregarArtigos();

  const botao = document.getElementById('botao-enviar');
  const retorno = document.getElementById('retorno-formulario');
  const campoData = document.getElementById('dataPreferida');

  // Não faz sentido oferecer datas passadas.
  if (campoData) {
    const hoje = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    campoData.min = iso(hoje);
    const limite = new Date(hoje);
    limite.setMonth(limite.getMonth() + 4);
    campoData.max = iso(limite);
  }

  const MENSAGENS = {
    nome: 'Informe seu nome completo.',
    email: 'Informe um e-mail válido.',
    telefone: 'Informe um telefone com DDD.',
    dataPreferida: 'Escolha uma data para a consulta.',
    periodoPreferido: 'Escolha um período.',
    consentimentoLGPD: 'É preciso aceitar a política de privacidade para continuar.',
  };

  function limparErros() {
    formulario.querySelectorAll('[data-erro]').forEach((el) => { el.textContent = ''; });
    formulario.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.removeAttribute('aria-invalid');
    });
  }

  function marcarErro(campo, mensagem) {
    const alvo = formulario.querySelector(`[data-erro="${campo}"]`);
    if (alvo) alvo.textContent = mensagem;
    const entrada = formulario.elements[campo];
    if (entrada && entrada.setAttribute) entrada.setAttribute('aria-invalid', 'true');
  }

  /** Validação no cliente. A do servidor continua sendo a que vale. */
  function validar(dados) {
    const erros = {};

    if (!dados.nome || dados.nome.trim().length < 2) erros.nome = MENSAGENS.nome;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.email || '')) erros.email = MENSAGENS.email;

    const digitos = (dados.telefone || '').replace(/\D/g, '');
    if (digitos.length < 10 || digitos.length > 13) erros.telefone = MENSAGENS.telefone;

    if (!dados.dataPreferida) {
      erros.dataPreferida = MENSAGENS.dataPreferida;
    } else {
      // Compara como data local, sem fuso, para não invalidar "hoje".
      const [a, m, d] = dados.dataPreferida.split('-').map(Number);
      const escolhida = new Date(a, m - 1, d);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (escolhida < hoje) erros.dataPreferida = 'A data precisa ser hoje ou no futuro.';
    }

    if (!dados.consentimentoLGPD) erros.consentimentoLGPD = MENSAGENS.consentimentoLGPD;

    return erros;
  }

  function mostrarRetorno(tipo, titulo, texto) {
    retorno.className = `retorno retorno--${tipo}`;
    retorno.innerHTML = `<strong>${window.Site.esc(titulo)}</strong>${window.Site.esc(texto)}`;
    retorno.hidden = false;
    retorno.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErros();
    retorno.hidden = true;

    const bruto = new FormData(formulario);
    const dados = {
      nome: (bruto.get('nome') || '').trim(),
      email: (bruto.get('email') || '').trim(),
      telefone: (bruto.get('telefone') || '').trim(),
      modalidade: bruto.get('modalidade') || 'online',
      tipoConsulta: bruto.get('tipoConsulta') || 'primeira-consulta',
      dataPreferida: bruto.get('dataPreferida') || '',
      periodoPreferido: bruto.get('periodoPreferido') || 'manha',
      mensagem: (bruto.get('mensagem') || '').trim(),
      consentimentoLGPD: bruto.get('consentimentoLGPD') === 'on',
      website: bruto.get('website') || '', // honeypot
    };

    const erros = validar(dados);
    if (Object.keys(erros).length > 0) {
      Object.entries(erros).forEach(([campo, msg]) => marcarErro(campo, msg));
      const primeiro = formulario.querySelector('[aria-invalid="true"]');
      if (primeiro) primeiro.focus();
      return;
    }

    botao.disabled = true;
    const textoOriginal = botao.textContent;
    botao.textContent = 'Enviando…';

    try {
      const resposta = await api('/agendamentos', {
        method: 'POST',
        body: JSON.stringify(dados),
      });

      formulario.reset();
      if (campoData) campoData.value = '';

      mostrarRetorno(
        'sucesso',
        resposta.duplicado ? 'Já temos sua solicitação' : 'Solicitação recebida!',
        resposta.mensagem ||
          'Entraremos em contato em até 1 dia útil para confirmar o horário.'
      );
    } catch (err) {
      if (err.campos) {
        Object.entries(err.campos).forEach(([campo, msg]) => marcarErro(campo, msg));
        mostrarRetorno('erro', 'Confira os campos destacados', 'Alguns dados precisam ser corrigidos.');
      } else if (err.status === 429) {
        mostrarRetorno('erro', 'Muitas tentativas', 'Aguarde um minuto antes de enviar novamente.');
      } else if (err.status === 503) {
        mostrarRetorno(
          'erro',
          'Serviço indisponível no momento',
          'Não conseguimos registrar sua solicitação. Escreva para doutor.antoniofelipe.saudemental@gmail.com que respondemos por lá.'
        );
      } else {
        mostrarRetorno(
          'erro',
          'Não foi possível enviar',
          'Tente novamente em instantes ou escreva para doutor.antoniofelipe.saudemental@gmail.com.'
        );
      }
      console.warn('[agendamento]', err.message);
    } finally {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  });

  // Limpa o erro de um campo assim que o usuário começa a corrigi-lo.
  formulario.addEventListener('input', (evento) => {
    const nome = evento.target.name;
    if (!nome) return;
    const alvo = formulario.querySelector(`[data-erro="${nome}"]`);
    if (alvo && alvo.textContent) {
      alvo.textContent = '';
      evento.target.removeAttribute('aria-invalid');
    }
  });

  /* ----------------------- Contato — Serviços ---------------------------- */

  const formularioServicos = document.getElementById('formulario-contato-servicos');

  if (formularioServicos) {
    // Os CTAs dos cards de Serviços já chegam com o tipo de atendimento certo marcado.
    document.querySelectorAll('[data-preencher-tipo]').forEach((link) => {
      link.addEventListener('click', () => {
        const valor = link.dataset.preencherTipo;
        const radio = formularioServicos.querySelector(`input[name="tipoAtendimento"][value="${valor}"]`);
        if (radio) radio.checked = true;
      });
    });

    // Mesma pré-marcação, mas vinda de outra página (ex.: CTA de uma
    // ferramenta embutida num artigo, tipo /?tipo=consultoria-empresa#contato-servicos)
    // — o clique aconteceu num documento diferente, então o listener acima nunca dispara.
    const tipoDaUrl = new URLSearchParams(location.search).get('tipo');
    if (tipoDaUrl) {
      const radioUrl = formularioServicos.querySelector(`input[name="tipoAtendimento"][value="${tipoDaUrl}"]`);
      if (radioUrl) radioUrl.checked = true;
    }

    const botaoServicos = document.getElementById('botao-enviar-servicos');
    const retornoServicos = document.getElementById('retorno-formulario-servicos');

    const MENSAGENS_SERVICOS = {
      nome: 'Informe seu nome completo.',
      email: 'Informe um e-mail válido.',
      telefone: 'Informe um telefone com DDD.',
      mensagem: 'Escreva um pouco sobre o que você procura (mínimo 10 caracteres).',
      consentimentoLGPD: 'É preciso aceitar a política de privacidade para continuar.',
    };

    function limparErrosServicos() {
      formularioServicos.querySelectorAll('[data-erro]').forEach((el) => { el.textContent = ''; });
      formularioServicos.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
        el.removeAttribute('aria-invalid');
      });
    }

    function marcarErroServicos(campo, mensagem) {
      const alvo = formularioServicos.querySelector(`[data-erro="${campo}"]`);
      if (alvo) alvo.textContent = mensagem;
      const entrada = formularioServicos.elements[campo];
      if (entrada && entrada.setAttribute) entrada.setAttribute('aria-invalid', 'true');
    }

    function validarServicos(dados) {
      const erros = {};
      if (!dados.nome || dados.nome.trim().length < 2) erros.nome = MENSAGENS_SERVICOS.nome;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.email || '')) erros.email = MENSAGENS_SERVICOS.email;

      const digitos = (dados.telefone || '').replace(/\D/g, '');
      if (digitos.length < 10 || digitos.length > 13) erros.telefone = MENSAGENS_SERVICOS.telefone;

      if (!dados.mensagem || dados.mensagem.trim().length < 10) erros.mensagem = MENSAGENS_SERVICOS.mensagem;
      if (!dados.consentimentoLGPD) erros.consentimentoLGPD = MENSAGENS_SERVICOS.consentimentoLGPD;

      return erros;
    }

    function mostrarRetornoServicos(tipo, titulo, texto) {
      retornoServicos.className = `retorno retorno--${tipo}`;
      retornoServicos.innerHTML = `<strong>${window.Site.esc(titulo)}</strong>${window.Site.esc(texto)}`;
      retornoServicos.hidden = false;
      retornoServicos.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    formularioServicos.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      limparErrosServicos();
      retornoServicos.hidden = true;

      const bruto = new FormData(formularioServicos);
      const dados = {
        nome: (bruto.get('nome') || '').trim(),
        email: (bruto.get('email') || '').trim(),
        telefone: (bruto.get('telefone') || '').trim(),
        tipoAtendimento: bruto.get('tipoAtendimento') || 'particular',
        mensagem: (bruto.get('mensagem') || '').trim(),
        consentimentoLGPD: bruto.get('consentimentoLGPD') === 'on',
        website: bruto.get('website') || '', // honeypot
      };

      const erros = validarServicos(dados);
      if (Object.keys(erros).length > 0) {
        Object.entries(erros).forEach(([campo, msg]) => marcarErroServicos(campo, msg));
        const primeiro = formularioServicos.querySelector('[aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        return;
      }

      botaoServicos.disabled = true;
      const textoOriginal = botaoServicos.textContent;
      botaoServicos.textContent = 'Enviando…';

      try {
        const resposta = await api('/contato', {
          method: 'POST',
          body: JSON.stringify(dados),
        });

        formularioServicos.reset();

        mostrarRetornoServicos(
          'sucesso',
          resposta.duplicado ? 'Já temos sua mensagem' : 'Mensagem recebida!',
          resposta.mensagem || 'Entraremos em contato em até 2 dias úteis.'
        );
      } catch (err) {
        if (err.campos) {
          Object.entries(err.campos).forEach(([campo, msg]) => marcarErroServicos(campo, msg));
          mostrarRetornoServicos('erro', 'Confira os campos destacados', 'Alguns dados precisam ser corrigidos.');
        } else if (err.status === 429) {
          mostrarRetornoServicos('erro', 'Muitas tentativas', 'Aguarde um minuto antes de enviar novamente.');
        } else if (err.status === 503) {
          mostrarRetornoServicos(
            'erro',
            'Serviço indisponível no momento',
            'Não conseguimos registrar sua mensagem. Escreva para doutor.antoniofelipe.saudemental@gmail.com que respondemos por lá.'
          );
        } else {
          mostrarRetornoServicos(
            'erro',
            'Não foi possível enviar',
            'Tente novamente em instantes ou escreva para doutor.antoniofelipe.saudemental@gmail.com.'
          );
        }
        console.warn('[contato-servicos]', err.message);
      } finally {
        botaoServicos.disabled = false;
        botaoServicos.textContent = textoOriginal;
      }
    });

    formularioServicos.addEventListener('input', (evento) => {
      const nome = evento.target.name;
      if (!nome) return;
      const alvo = formularioServicos.querySelector(`[data-erro="${nome}"]`);
      if (alvo && alvo.textContent) {
        alvo.textContent = '';
        evento.target.removeAttribute('aria-invalid');
      }
    });
  }

  carregarArtigos();
})();
