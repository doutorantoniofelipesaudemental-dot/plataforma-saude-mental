/** Posts de "bastidores da prática" (15%): como o trabalho é feito. Sem pacientes, sem casos, sem promessa. Escritos à mão e revisados. */
const SITE = 'https://www.drantoniofelipemedico.com.br';
const mk = (titulo, corpo) => ({ titulo, texto: corpo.trim() });
const BASTIDORES = [
  mk('Por que todo texto do portal tem áudio', `
Todo texto do portal tem narração em áudio no topo da página. O motivo é acessibilidade: nem todo mundo lê com facilidade no celular, depois de um plantão ou com pouco tempo.

Como isso funciona nos bastidores:
• a voz é sintética, e isso fica claro para quem ouve;
• o áudio é conferido antes de ir ao ar (duração, cortes e tamanho do arquivo);
• se o texto muda, o áudio antigo deixa de tocar até ser refeito, para nunca ler uma versão que já foi corrigida;
• a identificação do autor e as referências não entram na narração.

Quem trabalha em saúde sabe: informação que não chega à pessoa não cuida de ninguém. Acessibilidade também é contraste, tamanho de letra e botões grandes o bastante para o dedo, e tudo isso é testado nas páginas do portal.

Conheça o portal: ${SITE}`),
  mk('Como as referências dos textos são conferidas', `
Um texto de saúde só vale o que as suas referências valem. Por isso cada texto do portal passa por uma conferência antes da publicação e ao longo do tempo.

O que é verificado:
• se cada link e cada DOI abre (link quebrado é corrigido);
• se a referência sustenta o número ou a recomendação citada no texto;
• se existe retratação: toda semana as referências são cruzadas com bases como Crossref e PubMed, e artigo retratado reprova o texto;
• se dados com mais de dois anos estão marcados como tal.

Não é perfeito, e por isso é rotina, não evento único. Errar e corrigir faz parte; esconder o erro, não. Quando uma referência é trocada, o texto é revisado de novo para garantir que a conclusão continua se sustentando.

Portal: ${SITE}`),
  mk('"Narrativa composta": o que significa', `
Alguns textos do portal contam uma cena: uma consulta, uma conversa em família, um plantão. Todos trazem o aviso "Narrativa composta".

O que isso quer dizer:
• a cena é construída a partir de padrões observados na prática, não de uma pessoa específica;
• nomes, idades e circunstâncias são criados ou alterados;
• nenhum personagem corresponde a uma pessoa real.

Por quê? Porque sigilo e dignidade não são negociáveis. A história serve para ajudar a reconhecer situações parecidas, nunca para expor alguém. É o que a ética médica e a LGPD pedem de qualquer conteúdo educativo. Se algum trecho lembrar alguém, é coincidência de padrão: o sofrimento se repete, as pessoas não.

Portal: ${SITE}`),
  mk('Por que todo texto com conduta traz o aviso dos protocolos locais', `
Todo texto que fala de condutas, doses ou fluxos termina com o mesmo aviso: é orientação geral, e se respeitam sempre os protocolos do hospital, do Pronto Atendimento e da rede de saúde local.

Três razões práticas:
• cada serviço tem seus fluxos, seus recursos e suas pactuações com a rede (UBS, CAPS, SAMU);
• o que funciona em um município pode ser inviável em outro;
• conteúdo educativo apoia a decisão da equipe, não substitui o protocolo nem a avaliação de cada pessoa.

Padronizar o aviso é um jeito simples de lembrar isso toda vez. Se o seu serviço tem um fluxo próprio, é ele que vale, e é a ele que a equipe deve recorrer sempre. O resultado é uma rede mais previsível para quem trabalha nela.

Portal: ${SITE}`),
  mk('Auditoria antes de publicar: o que olhamos', `
Antes de um texto ir ao ar, ele passa por uma auditoria em quatro olhares.

• Técnico: link e DOI funcionando, título e resumo coerentes, identificação do autor uma única vez.
• Científico: cada número ou recomendação tem referência que a sustenta.
• Ético: conforme a Resolução CFM 2.336/2023, sem promessa nem sensacionalismo; temas como suicídio seguem as orientações da OMS, sem método nem local, sempre com CVV 188 e SAMU 192.
• Humanizado: fala com a pessoa, em linguagem simples, sem culpa, medo ou vergonha.

O objetivo não é parecer rigoroso. É que quem lê possa confiar. A auditoria roda de novo antes de cada publicação e uma vez por semana sobre o que já está no ar.

Portal: ${SITE}`),
  mk('Pronto Atendimento e Atenção Primária: etapas da mesma rede', `
Trabalhar em saúde mental no Pronto Atendimento e na Atenção Primária mostra duas faces do mesmo cuidado.

• No Pronto Atendimento, o foco costuma ser avaliar risco, estabilizar e organizar o encaminhamento.
• Na Atenção Primária, o foco é o vínculo, o seguimento ao longo do tempo e o cuidado do território.
• As duas dependem da rede: UBS, CAPS, SAMU e serviços de urgência precisam conversar entre si.

Quando a transição entre os serviços é bem feita, ninguém se perde no caminho. É nisso que vale investir tempo de equipe: combinar quem encaminha, para onde, com que informações e quem acompanha depois. Nenhum serviço sozinho dá conta de tudo, e a rede funciona quando todos conhecem o papel de cada ponto.

Portal: ${SITE}`),
];
module.exports = { BASTIDORES };
