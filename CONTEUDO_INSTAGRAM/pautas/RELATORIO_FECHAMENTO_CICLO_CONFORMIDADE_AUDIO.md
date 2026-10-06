# Relatório de fechamento do ciclo: conformidade (nota de IA) e áudio narrado

Data: 2026-10-06. Resume o que foi feito e verificado neste ciclo e o que segue pendente. **Não valida o conteúdo clínico** nem substitui a revisão do Dr. Antônio Felipe.

## 1. Nota de transparência de IA (Resolução CFM 2.454/2026)

- **O que mudou:** a nota "Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026)" entrou no rodapé de `public/artigo.html` (PR #36).
- **Alcance:** esse arquivo é a base do shell estático e da página pré-renderizada de todos os artigos publicados (251), então todos herdam a nota.
- **Trava:** teste novo em `tests/unit/assinatura-cfm.test.js` compara a nota com a fonte única `AVISO_CFM` e exige que a página pré-renderizada a traga. Suíte: 197 testes, todos passando.
- **No ar:** conferido pelo HTML em 3 artigos (`alimentacao-criancas`, `relato-territorio-segredos`, `dependencia-quimica`): nota presente, citação da Resolução 2.454/2026 e player de áudio. Os demais não foram abertos um a um.
- **Fora do alcance desta mudança:** `index.html`, `blog.html` e `instagram.html` não receberam a nota.

## 2. Áudio narrado dos artigos do portal

- **Voz e provedor:** Azure Speech, `pt-BR-AntonioNeural`, camada gratuita (500.000 caracteres/mês).
- **Lote de outubro de 2026:** 230 artigos sintetizados, 0 falhas, **499.917 de 500.000 caracteres** usados. A ferramenta parou sozinha antes de `sindrome-neuroleptica-maligna` para não estourar a cota. Log do lote: `narracoes-geradas/_lote-2026-10.log`.
- **Envio para produção:** 230 MP3 enviados sem sintetizar de novo, 0 falhas (`narracoes-geradas/_envio-2026-10.log`).
- **Cobertura:** **234 de 251** artigos publicados com áudio em dia (4 de antes mais os 230 desta rodada); nenhum com áudio antigo; **17 sem áudio**.
- **Verificado no servidor:** o arquivo de áudio de `alimentacao-criancas` responde 200 com `audio/mpeg`, e a API registra provedor Azure e 3.760 caracteres.
- **Observação:** a chave da ElevenLabs foi rejeitada (401) e `ELEVENLABS_VOICE_ID` não está definido; não foi usada.
- **Os arquivos de áudio não estão no Git:** `narracoes-geradas/` é ignorado de propósito; eles vão direto para o armazenamento do portal.

### 17 artigos ainda sem áudio (23.486 caracteres, cabem na cota de 1º de novembro)

- sindrome-neuroleptica-maligna (1.739 car.)
- sindrome-panico-o-que-e (987)
- sobrecarga-docente-descompressao (2.353)
- solidao-diferenca-estar-sozinho (878)
- tcc-quando-indicar-aps (1.723)
- tdah-adultos-sinais (824)
- tempo-tela-bebes-primeira-infancia (1.383)
- tept-aps (1.687)
- terapia-online-funciona (742)
- terapia-primeira-vez-o-que-esperar (964)
- toc-sinais-consulta (1.830)
- trabalho-domestico-invisivel-estresse (1.844)
- trabalho-noturno-turnos-saude-mental (1.513)
- transicao-carreira-aposentadoria-identidade (2.044)
- trauma-infancia-adulto (827)
- vergonha-culpa-diferenca (768)
- violencia-domestica-impacto-criancas (1.380)

## 3. Pendências abertas

1. **Áudio dos 17 artigos acima:** retomar a partir de 1º de novembro (`npm run narrar -- --pendentes --enviar`), ou usar outro provedor (Edge-TTS) antes disso.
2. **Áudio narrado e trilha dos 114 carrosséis:** não gerados (são mídias diferentes dos áudios dos artigos).
3. **Referências dos Lotes 81 a 114:** leitura integral pelo Dr. Antônio Felipe; a pauta 155 tem uma referência parcial.
4. **Rascunho dos `linkedin.txt` dos pacotes 001 a 006:** aguarda revisão do Dr. Antônio Felipe.
5. **Nota de IA nas demais páginas públicas** (início, blog, Instagram), se desejado.
6. **Conferência no navegador** das páginas de artigo (a verificação foi pelo HTML, por amostra).
