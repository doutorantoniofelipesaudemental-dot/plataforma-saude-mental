/**
 * Roteiros dos 30 Reels de 30s de Instagram, em formato estruturado.
 *
 * Fonte editorial: `CONTEUDO_INSTAGRAM/30_ROTEIROS_REELS.md` (curadoria feita
 * a partir dos 65 artigos da coleção `artigos` do MongoDB). Este módulo é a
 * versão em dados desse conteúdo, para ser servida pela rota administrativa
 * `/api/admin/export-video-data` e consumida por ferramentas de geração
 * automática de vídeo — se o roteiro mudar, atualize os dois lugares.
 *
 * `categoria` reflete o valor real do campo `categoria` do artigo-base em
 * `backend/models/Artigo.js` (mesmo enum `CATEGORIAS`).
 */

const HASHTAGS_FIXAS = ['#saudemental', '#medicinadefamilia', '#doutorsaudemental', '#reels', '#saudementalimporta'];

const ROTEIROS_REELS = [
  {
    tema: 'O medo do remédio',
    slugArtigo: 'relato-medo-remedio',
    categoria: 'Relatos da Prática',
    textoTela: ['MEDO DO REMÉDIO', 'NÃO É TEIMOSIA', 'É CONFIANÇA A CONSTRUIR'],
    bRoll: 'Consultório médico acolhedor; close em cartela de comprimidos sobre a mesa; paciente hesitante segurando a receita; médico conversando em tom calmo; mãos entregando um copo d’água.',
    legenda:
      'Medo de remédio psiquiátrico é mais comum (e mais compreensível) do que parece. Este relato mostra como a confiança, não a pressão, muda esse quadro. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#medodetratamento', '#psicofarmacos'],
  },
  {
    tema: 'A aposta que consumiu uma família',
    slugArtigo: 'relato-aposta-familia',
    categoria: 'Relatos da Prática',
    textoTela: ['A DÍVIDA APARECEU ANTES DO MOTIVO', 'JOGO PATOLÓGICO NÃO É SOBRE DINHEIRO'],
    bRoll: 'Mãos mexendo no celular com um app de apostas; extrato bancário com saldo negativo; família em silêncio à mesa de jantar; luz de tela de celular refletida no rosto à noite.',
    legenda:
      'Por trás de uma dívida "inexplicável" às vezes há um transtorno não identificado. Veja os sinais de jogo patológico. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#jogopatologico', '#apostas'],
  },
  {
    tema: 'Sinais de compulsão alimentar em adolescente',
    slugArtigo: 'relato-prato-campo-batalha',
    categoria: 'Relatos da Prática',
    textoTela: ['COMER ESCONDIDO', 'CULPA DEPOIS DE COMER', 'PRESTE ATENÇÃO'],
    bRoll: 'Prato de comida intocado; adolescente fechando a porta do quarto com um pacote de biscoito; mãe observando pela fresta da porta; geladeira sendo aberta à noite.',
    legenda:
      'Um relato sobre como uma mãe percebeu sinais de compulsão alimentar na filha adolescente — antes de qualquer exame apontar algo. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#compulsaoalimentar', '#adolescencia'],
  },
  {
    tema: 'O cigarro que ninguém perguntava',
    slugArtigo: 'relato-tabaco-ninguem-perguntava',
    categoria: 'Relatos da Prática',
    textoTela: ['20 ANOS FUMANDO', 'NINGUÉM PERGUNTOU', 'TABAGISMO TEM TRATAMENTO'],
    bRoll: 'Cinzeiro com cigarros apagados; mão pegando um maço de cigarro; consulta médica com ficha de anamnese; calendário marcado com tentativas de parar.',
    legenda:
      'Dependência de nicotina também é dependência química — e também merece tratamento de verdade. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#tabagismo', '#dependenciaquimica'],
  },
  {
    tema: 'Depressão no idoso disfarçada de "velhice"',
    slugArtigo: 'relato-corpo-envelhece-mente-esquecida',
    categoria: 'Relatos da Prática',
    textoTela: ["'É A IDADE'", 'SÓ QUE NÃO ERA', 'DEPRESSÃO TEM TRATAMENTO'],
    bRoll: 'Idoso olhando pela janela; mãos enrugadas segurando uma xícara de chá; álbum de fotos antigo sendo folheado; consulta geriátrica com médico anotando.',
    legenda:
      'Tristeza na velhice não é sempre "normal da idade". Às vezes, é depressão — e tem tratamento. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#saudementaldoidoso', '#depressao'],
  },
  {
    tema: 'O que faz alguém voltar ao tratamento',
    slugArtigo: 'relato-ultima-consulta-antes-desistir',
    categoria: 'Relatos da Prática',
    textoTela: ['ELE IA DESISTIR', 'UMA COISA MUDOU', 'SER OUVIDO'],
    bRoll: 'Sala de espera vazia; paciente com a mão na maçaneta da porta; médico se inclinando para escutar com atenção; aperto de mão de despedida.',
    legenda:
      'O que faz alguém decidir continuar um tratamento, mesmo já tendo decidido parar? Às vezes, é simplesmente ser ouvido. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#adesaoaotratamento', '#relatodeconsultorio'],
  },
  {
    tema: 'Quando o consultório revela violência doméstica',
    slugArtigo: 'relato-territorio-segredos',
    categoria: 'Relatos da Prática',
    textoTela: ['O VÍNCULO REVELOU', 'O QUE NENHUM EXAME MOSTRARIA'],
    bRoll: 'Agente de saúde caminhando por rua de bairro residencial; visita domiciliar batendo à porta; ficha de família em prancheta; mãos preenchendo prontuário da ESF.',
    legenda:
      'Vínculo territorial na Atenção Primária pode revelar o que nenhum exame mostraria. Um relato sobre isso. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#violenciadomestica', '#atencaoprimaria'],
  },
  {
    tema: 'O cuidador que ninguém via',
    slugArtigo: 'relato-peso-invisivel-cuidador',
    categoria: 'Relatos da Prática',
    textoTela: ['A CONSULTA ERA DELE', 'A SOBRECARGA ERA DELA', 'E VOCÊ, COMO ESTÁ?'],
    bRoll: 'Cuidadora ajudando idoso a caminhar; olheiras visíveis de cansaço; xícara de café esfriando sobre a mesa; cuidadora sentada sozinha à noite, exausta.',
    legenda:
      'Quem cuida também precisa ser perguntado: "e você, como está?" 💙 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#cuidadorfamiliar', '#sobrecarga'],
  },
  {
    tema: 'Roblox e Fortnite: o que pais precisam saber',
    slugArtigo: 'jogos-online-criancas',
    categoria: 'Pais & Famílias',
    textoTela: ['ROBLOX / FORTNITE', '3 RISCOS REAIS', 'ECA DIGITAL MUDOU AS REGRAS'],
    bRoll: 'Criança jogando videogame com fone de ouvido; tela de celular com chat de jogo online; controle de videogame nas mãos de uma criança; pais observando de longe.',
    legenda:
      'O que pais precisam saber sobre Roblox, Fortnite e jogos online — riscos reais e o que mudou com o ECA Digital. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#jogosonline', '#ecadigital', '#paisefilhos'],
  },
  {
    tema: 'Primeiros sinais de surto psicótico',
    slugArtigo: 'primeiro-episodio-psicotico',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['ANTES DO SURTO', '3 SINAIS DE ALERTA', 'RECONHECIMENTO PRECOCE IMPORTA'],
    bRoll: 'Jovem isolado em um quarto escuro; corredor de pronto-socorro psiquiátrico; médico revisando exames; prontuário eletrônico com anotações clínicas.',
    legenda:
      'Reconhecimento precoce de psicose salva anos de sofrimento. Sinais de alerta que família e profissionais deveriam conhecer. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#psicose', '#saudementaljovem'],
  },
  {
    tema: 'Saiu do pronto-socorro psiquiátrico: e agora?',
    slugArtigo: 'alta-pa-psiquiatrico',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['SAIU DO PA', 'E AGORA?', 'O PÓS-CRISE DECIDE TUDO'],
    bRoll: 'Porta de saída de um hospital; paciente acompanhado por familiar até o carro; agenda de retorno sendo marcada; ligação telefônica de acompanhamento.',
    legenda:
      'A alta do pronto-socorro psiquiátrico não é o fim do cuidado — é onde o cuidado de verdade começa. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#urgenciapsiquiatrica', '#pospcrise'],
  },
  {
    tema: 'Primeiros minutos de uma crise psiquiátrica',
    slugArtigo: 'manejo-crise-psiquiatrica',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['PRIMEIROS 5 MINUTOS', 'SEGURANÇA. CALMA. SEM CONFRONTO.', '188 CVV EM EMERGÊNCIA'],
    bRoll: 'Sala calma sendo preparada; mãos afastando objetos de uma mesa; pessoa falando pausadamente com gestos calmos; telefone discando um número de emergência.',
    legenda:
      'O que fazer nos primeiros minutos de uma crise psiquiátrica aguda. Salve este vídeo. 📖 [LINK] 🆘 CVV 188 📅 [LINK BIO]',
    hashtagsExtras: ['#crisepsiquiatrica', '#primeirossocorros'],
    alertaEmergencia: true,
  },
  {
    tema: 'Você está sobrecarregado como cuidador?',
    slugArtigo: 'sobrecarga-cuidador-consulta',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['3 SINAIS DE SOBRECARGA', 'CUIDAR DE SI NÃO É EGOÍSMO'],
    bRoll: 'Cuidador(a) esfregando os olhos de cansaço; pilha de medicamentos e organizador semanal; cuidador sentado à beira da cama do paciente; um respiro sozinho com uma xícara de chá.',
    legenda:
      'Você é cuidador de alguém da família? Veja 3 sinais de que a sobrecarga já chegou perto do limite. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#sobrecargadocuidador', '#saudedocuidador'],
  },
  {
    tema: 'Depressão pós-parto: sinais que a família nota',
    slugArtigo: 'saude-mental-perinatal-consulta',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['A FAMÍLIA PERCEBE PRIMEIRO', '3 SINAIS DE DEPRESSÃO PÓS-PARTO'],
    bRoll: 'Mãe segurando o bebê recém-nascido com olhar distante; quarto de bebê em penumbra; família observando com preocupação; consulta de puerpério.',
    legenda:
      'A família muitas vezes percebe a depressão pós-parto antes da própria mãe. Fique atento a esses sinais. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#depressaoposparto', '#maternidadereal'],
  },
  {
    tema: 'É a idade ou é depressão?',
    slugArtigo: 'saude-mental-idoso-consulta',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['É A IDADE OU É DEPRESSÃO?', 'A DIFERENÇA IMPORTA'],
    bRoll: 'Idoso sentado em poltrona olhando para o nada; mãos segurando uma bengala; consulta com exame cognitivo em prancheta; família visitando o idoso em casa.',
    legenda:
      'Como diferenciar o envelhecimento normal de depressão em idosos — e por que essa diferença muda tudo. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#saudementaldoidoso', '#depressao'],
  },
  {
    tema: '5 sinais de jogo patológico',
    slugArtigo: 'jogo-patologico-rastreio',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['5 SINAIS DE JOGO PATOLÓGICO'],
    bRoll: 'Tela de celular com app de apostas esportivas; mão passando cartão em caixa eletrônico; notificações de apostas piscando na tela; carteira vazia sobre a mesa.',
    legenda: '5 sinais de que apostar deixou de ser lazer. Reconheceu algum? 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#jogopatologico', '#apostasonline'],
  },
  {
    tema: 'Sinais de compulsão alimentar que passam despercebidos',
    slugArtigo: 'compulsao-alimentar-rastreio',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['NÃO É SOBRE FOME', '3 SINAIS QUE PASSAM DESPERCEBIDOS'],
    bRoll: 'Geladeira sendo aberta de madrugada; embalagens vazias escondidas no lixo; pessoa comendo rapidamente e sozinha; espelho com reflexo desviado.',
    legenda:
      'Compulsão alimentar tem sinais que passam despercebidos até por quem vive isso. Preste atenção. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#compulsaoalimentar', '#transtornoalimentar'],
  },
  {
    tema: 'Uso social ou dependência?',
    slugArtigo: 'dependencia-quimica-rastreio-aps',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['USO SOCIAL X DEPENDÊNCIA', '3 SINAIS DE ALERTA'],
    bRoll: 'Copo de bebida sendo servido repetidamente; mesa de bar com garrafas vazias; consulta médica com questionário de triagem; calendário com tentativas marcadas de parar.',
    legenda: 'Como saber se é uso social ou já é dependência? Veja os sinais de alerta. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#dependenciaquimica', '#alcoolismo'],
  },
  {
    tema: 'Quando psicoterapia não é suficiente',
    slugArtigo: 'quando-encaminhar-aps',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['TERAPIA NÃO BASTA?', 'QUANDO PROCURAR UM PSIQUIATRA'],
    bRoll: 'Divã de consultório de psicoterapia; encaminhamento médico sendo escrito; dois profissionais de saúde conversando sobre um caso; paciente entre duas cadeiras, simbolizando psicólogo e psiquiatra.',
    legenda: 'Como saber se é hora de somar acompanhamento psiquiátrico à sua psicoterapia. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#psicoterapia'],
  },
  {
    tema: 'Esquecimento normal ou sinal de alerta?',
    slugArtigo: 'neuropsicologia-pratica-clinica',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['ESQUECIMENTO NORMAL X SINAL DE ALERTA'],
    bRoll: 'Mão procurando chaves espalhadas na mesa; teste neuropsicológico com formas geométricas; idoso fazendo palavras cruzadas; neuropsicólogo aplicando avaliação.',
    legenda: 'Quando o esquecimento deixa de ser normal e passa a ser sinal de alerta? 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#neuropsicologia', '#memoria'],
  },
  {
    tema: 'Por que o psiquiatra ajusta a dose aos poucos',
    slugArtigo: 'psicofarmacos-aps-medicos',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['POR QUE A DOSE SOBE AOS POUCOS', 'SEGURANÇA, NÃO INDECISÃO'],
    bRoll: 'Cartela de comprimidos com doses crescentes; médico ajustando uma receita; gráfico de titulação de dose na tela do computador; paciente recebendo explicação com calma.',
    legenda:
      'Por que o ajuste de dose em psicofármacos é gradual — e por que isso é bom sinal, não demora desnecessária. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#psicofarmacos', '#tratamentopsiquiatrico'],
  },
  {
    tema: 'O que ninguém conta sobre atender saúde mental na graduação',
    slugArtigo: 'realidade-saude-mental-aps',
    categoria: 'Residentes & Estudantes',
    textoTela: ['A FACULDADE ENSINA O PROTOCOLO', 'A PRÁTICA É OUTRA HISTÓRIA'],
    bRoll: 'Residente correndo entre consultórios; sala de espera lotada de UBS; relógio marcando poucos minutos de consulta; pilha de prontuários sobre a mesa.',
    legenda:
      'O que ninguém te conta sobre atender saúde mental na Atenção Primária — além do que a faculdade ensina. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#residenciamedica', '#atencaoprimaria', '#medestudante'],
  },
  {
    tema: 'Como saber se você chegou ao burnout',
    slugArtigo: 'burnout-aps',
    categoria: 'Geral',
    textoTela: ['CANSAÇO X BURNOUT', '3 SINAIS DE ALERTA'],
    bRoll: 'Profissional de saúde de jaleco sentado exausto no corredor; xícara de café esquecida esfriando; relógio de plantão avançando; olhos cansados refletidos na tela do computador.',
    legenda:
      'Quem cuida da Atenção Primária também precisa de cuidado. Sinais de burnout que merecem atenção. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#burnout', '#saudedotrabalhador'],
  },
  {
    tema: '3 mitos sobre remédio psiquiátrico',
    slugArtigo: 'psicofarmacos-mitos-culturais',
    categoria: 'Geral',
    textoTela: ['MITO 1', 'MITO 2', 'MITO 3'],
    bRoll: 'Referência estilizada a filmes antigos sobre "loucura"; cartela de remédio ao lado de um livro velho; médico balançando a cabeça em negação bem-humorada; texto animado desmontando cada mito.',
    legenda:
      '3 mitos sobre remédio psiquiátrico que ainda afastam muita gente do tratamento certo. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#mitosdesaudemental', '#psicofarmacos'],
  },
  {
    tema: 'Compulsão alimentar não é falta de força de vontade',
    slugArtigo: 'compulsao-alimentar',
    categoria: 'Pacientes & Famílias',
    textoTela: ['NÃO É FALTA DE FORÇA DE VONTADE', 'É UM TRANSTORNO COM TRATAMENTO'],
    bRoll: 'Pessoa se olhando no espelho com expressão de autocrítica; prato de comida sendo empurrado para o lado; mãos entrelaçadas em gesto de acolhimento; consulta com profissional de saúde.',
    legenda:
      'Compulsão alimentar não é sobre disciplina. É sobre um ciclo que pode (e deve) ser tratado. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#compulsaoalimentar', '#semjulgamento'],
  },
  {
    tema: 'Quem cuida também precisa ser cuidado',
    slugArtigo: 'saude-mental-cuidador',
    categoria: 'Pacientes & Famílias',
    textoTela: ['E VOCÊ, COMO ESTÁ?', 'CUIDAR DE SI TAMBÉM É CUIDAR DELE(A)'],
    bRoll: 'Cuidador(a) respirando fundo numa pausa; mãos segurando uma xícara de chá em momento de respiro; idoso e cuidador sorrindo juntos; grupo de apoio a cuidadores reunido.',
    legenda: 'Se você cuida de alguém, esse recado é pra você: cuidar de si também importa. 💙 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#cuidadorfamiliar', '#saudedocuidador'],
  },
  {
    tema: '3 coisas para nunca fazer numa crise psiquiátrica',
    slugArtigo: 'crise-psiquiatrica-familia',
    categoria: 'Pacientes & Famílias',
    textoTela: ['NUNCA FAÇA ISSO NUMA CRISE'],
    bRoll: 'Sala de estar com tensão familiar; mãos afastando objetos perigosos de uma mesa; pessoa falando ao telefone pedindo ajuda; família se abraçando depois que a crise passa.',
    legenda:
      '3 erros comuns durante uma crise psiquiátrica na família — e o que fazer no lugar. Salve este vídeo. 📖 [LINK] 🆘 CVV 188 📅 [LINK BIO]',
    hashtagsExtras: ['#crisepsiquiatrica', '#familia'],
    alertaEmergencia: true,
  },
  {
    tema: 'Dependência química é doença, não caráter',
    slugArtigo: 'dependencia-quimica',
    categoria: 'Pacientes & Famílias',
    textoTela: ['NÃO É FALTA DE CARÁTER', 'É DOENÇA. E TEM TRATAMENTO.'],
    bRoll: 'Grupo de apoio em círculo de cadeiras; mãos segurando um copo de água em vez de uma bebida; calendário com dias marcados de sobriedade; consulta de acompanhamento em CAPS AD.',
    legenda:
      'Dependência química não é sobre caráter. É sobre uma doença tratável — e ninguém deveria enfrentar isso sozinho. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#dependenciaquimica', '#recuperacao'],
  },
  {
    tema: 'Por que professores estão adoecendo',
    slugArtigo: 'professores-saude-mental',
    categoria: 'Geral',
    textoTela: ['QUEM FORMA PESSOAS TAMBÉM ADOECE', 'SINAIS DE ALERTA'],
    bRoll: 'Sala de aula vazia após o horário; professor organizando provas sozinho à noite; quadro branco cheio de anotações; professor massageando as têmporas na sala dos professores.',
    legenda:
      'O adoecimento silencioso de quem forma pessoas: saúde mental de professores merece mais atenção. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#saudementaldocente', '#professores'],
  },
  {
    tema: 'A pergunta que salva vidas',
    slugArtigo: 'risco-suicidio-aps',
    categoria: 'Médicos & Enfermeiros',
    textoTela: ['PERGUNTAR NÃO PLANTA A IDEIA', 'PERGUNTAR PODE SALVAR', '188 CVV'],
    bRoll: 'Mãos segurando um telefone prestes a discar; consulta médica com olhar atento e acolhedor; fita simbólica do Setembro Amarelo; cartaz do CVV 188 em ambiente de saúde.',
    legenda:
      'Perguntar sobre suicídio não planta a ideia — o silêncio é que é perigoso. Sinais de alerta que valem atenção. 📖 [LINK] 🆘 CVV 188 (24h, gratuito) 📅 [LINK BIO]',
    hashtagsExtras: ['#setembroamarelo', '#prevencaodosuicidio'],
    alertaEmergencia: true,
  },
  {
    tema: 'Burnout na gestão: o risco que a empresa não vê',
    slugArtigo: 'burnout-na-gestao-fatores-de-risco',
    categoria: 'Empresas & RH',
    textoTela: ['BURNOUT NÃO É FRAQUEZA', 'É FENÔMENO OCUPACIONAL (OMS)', 'TESTE OS 6 FATORES DE RISCO'],
    bRoll: 'Escritório movimentado visto de cima; gestor observando a equipe através do vidro da sala; pessoa em frente ao computador tarde da noite; mãos no rosto num intervalo entre reuniões.',
    legenda:
      'A OMS classifica burnout como fenômeno ocupacional, não fraqueza individual. No artigo tem uma matriz interativa para avaliar 6 fatores de risco na sua equipe agora. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#burnout', '#gestaodepessoas', '#riscopsicossocial'],
  },
  {
    tema: 'Estresse ou ansiedade? A diferença que sua equipe precisa saber',
    slugArtigo: 'ansiedade-corporativa-sintomas-tratamento',
    categoria: 'Empresas & RH',
    textoTela: ['ESTRESSE PASSA', 'ANSIEDADE CLÍNICA PERSISTE', 'FAÇA O CHECKLIST'],
    bRoll: 'Pessoa trabalhando sob pressão com múltiplas telas; respiração pausada em close; celular acendendo com notificações de trabalho à noite; xícaras de café acumuladas na mesa.',
    legenda:
      'Nem toda tensão no trabalho é a mesma coisa. O artigo traz um checklist rápido para diferenciar estresse do dia a dia de um quadro clínico. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#ansiedadecorporativa', '#saudementalnotrabalho'],
  },
  {
    tema: 'Cada R$1 em saúde mental retorna R$4, segundo a OMS',
    slugArtigo: 'saude-mental-pilar-de-performance-liderancas',
    categoria: 'Empresas & RH',
    textoTela: ['R$1 INVESTIDO', 'R$4 DE RETORNO (ESTIMATIVA OMS)', 'SIMULE O IMPACTO NA SUA EMPRESA'],
    bRoll: 'Liderança em reunião de planejamento estratégico; gráfico de performance em uma tela; equipe colaborando em ambiente leve e bem iluminado; aperto de mão após apresentação.',
    legenda:
      'Segundo estudo para a OMS, cada dólar investido em tratamento de ansiedade e depressão retorna cerca de quatro em produtividade. O artigo traz um simulador para estimar o impacto na sua empresa. 📖 [LINK] 📅 [LINK BIO]',
    hashtagsExtras: ['#performanceorganizacional', '#lideranca', '#prevencao'],
  },
];

module.exports = { ROTEIROS_REELS, HASHTAGS_FIXAS };
