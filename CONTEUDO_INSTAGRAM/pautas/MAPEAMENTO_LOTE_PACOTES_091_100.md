# Mapeamento proposto: Pacotes 91 a 100

Proposta de seleção das 10 próximas pautas redigidas que ainda não têm pacote em `pacotes/`, gerada a partir de `pautas/pautas.json` após a criação dos Pacotes 81 a 90. **Aguarda a decisão do Dr. Antônio Felipe**: nenhum pacote foi criado e `pautas.json`, `PAUTAS.md` e `agenda.csv` não foram alterados por este mapeamento.

**Critério:** primeiro as pautas com rascunho de revisão médica **aprovada**; depois as pendentes, por lote e por ordem da pauta. Restam 24 pautas redigidas sem pacote (nenhuma com rascunho aprovado: 0), então este **não é o lote final**: depois do 91 a 100 ainda restarão 14 pautas. As colunas de marcadores e de referências contam só o corpo do artigo.

| Pacote | Pauta (nº) | Título | Categoria / lote | Sensível | Revisão médica | Marcadores de dose | Referências sem PMID |
|---|---|---|---|---|---|---|---|
| 91 | 157 | Professores de educação infantil e a regulação emocional | Linhas de Cuidado (Cuidadores & Professores) / L5 | não | pendente | 1 | sim |
| 92 | 159 | Professores de EJA: lidando com histórias de superação | Linhas de Cuidado (Cuidadores & Professores) / L5 | não | pendente | 2 | sim |
| 93 | 160 | Cuidadores de pacientes com Alzheimer avançado e o luto antecipatório | Linhas de Cuidado (Cuidadores & Professores) / L5 | não | pendente | 1 | sim |
| 94 | 164 | Cuidadores familiares de dependentes químicos: manejo da codependência na APS | Linhas de Cuidado (Cuidadores & Professores) / L5 | sim (CVV 188 / SAMU 192) | pendente | 1 | sim |
| 95 | 167 | Disforia Sensorial e Sobrecarga no Transtorno do Espectro Autista | Condições Específicas / L5 | não | pendente | 1 | sim |
| 96 | 168 | Acatisia Induzida por Antipsicóticos: Diagnóstico e Conduta | Condições Específicas / L5 | não | pendente | 3 | sim |
| 97 | 169 | Transtorno da Fluência na Fala na Infância: Manejo Inicial na APS | Condições Específicas / L5 | não | pendente | 1 | sim |
| 98 | 173 | Distonia aguda por antipsicóticos na emergência: manejo prático | Residentes & Estudantes / L5 | não | pendente | 3 | sim |
| 99 | 179 | Professores e o suporte aos alunos com ideação suicida: guia na APS | Linhas de Cuidado (Cuidadores & Professores) / L5 | sim (CVV 188 / SAMU 192) | pendente | 1 | sim |
| 100 | 180 | Uso Off-Label de Psicofármacos na UBS: Evidências e Prática | Residentes & Estudantes / L5 | não | pendente | 1 | sim |

## Rascunhos de origem

- Pacote 91: `CONTEUDO_INSTAGRAM/pautas/rascunhos/professores-de-educacao-infantil-e-a-regulacao-emocional.md`
- Pacote 92: `CONTEUDO_INSTAGRAM/pautas/rascunhos/professores-de-eja-lidando-com-historias-de-superacao.md`
- Pacote 93: `CONTEUDO_INSTAGRAM/pautas/rascunhos/cuidadores-de-pacientes-com-alzheimer-avancado-e-o-luto-ante.md`
- Pacote 94: `CONTEUDO_INSTAGRAM/pautas/rascunhos/cuidadores-familiares-de-dependentes-quimicos-manejo-da-code.md`
- Pacote 95: `CONTEUDO_INSTAGRAM/pautas/rascunhos/disforia-sensorial-e-sobrecarga-no-transtorno-do-espectro-au.md`
- Pacote 96: `CONTEUDO_INSTAGRAM/pautas/rascunhos/acatisia-induzida-por-antipsicoticos-diagnostico-e-conduta.md`
- Pacote 97: `CONTEUDO_INSTAGRAM/pautas/rascunhos/transtorno-da-fluencia-na-fala-na-infancia-manejo-inicial-na.md`
- Pacote 98: `CONTEUDO_INSTAGRAM/pautas/rascunhos/distonia-aguda-por-antipsicoticos-na-emergencia-manejo-prati.md`
- Pacote 99: `CONTEUDO_INSTAGRAM/pautas/rascunhos/professores-e-o-suporte-aos-alunos-com-ideacao-suicida-guia-.md`
- Pacote 100: `CONTEUDO_INSTAGRAM/pautas/rascunhos/uso-off-label-de-psicofarmacos-na-ubs-evidencias-e-pratica.md`

## Pautas restantes sem marcadores de dose e com referências completas

Nenhuma entre as pautas restantes: todas têm marcadores de dose ou referências por conferir.

## Observações

- A numeração dos pacotes (`novo-fluxo-NN`) é própria e não coincide com o número da pauta.
- O cruzamento "sem pacote" foi feito pelo título (slug idêntico ao nome do arquivo em `pacotes/`); confira antes de montar.
- Pautas sensíveis exigem CVV 188 / SAMU 192, RAPS e o aviso de protocolos locais em todas as peças.
- As pautas com marcadores de dose ou referências sem PMID só podem ser aprovadas depois de resolvidos no artigo (ver `DOSSIER_REVISAO_LOTES_081_090.md` para o formato).
- Pacotes a montar conforme `pautas/PADRAO_PACOTE_MULTIMIDIA.md` e `MODELO_ROTEIRO_MULTIMIDIA.md`; os carrosséis animados saem do motor `interativos/js/CarrosselAnimado.js`.
