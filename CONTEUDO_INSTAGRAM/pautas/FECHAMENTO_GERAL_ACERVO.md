# Fechamento geral do acervo (2026-10-06)

Estado final do acervo do Portal de Saúde Mental Dr. Antônio Felipe ao fim do ciclo de 2026-10-05 a 2026-10-06, sobre a `main` (commit `b9b2104` mais este documento). É um **resumo de uma página**: cada item aponta para o relatório que traz a evidência. **Não valida o conteúdo clínico.**

## 1. O que existe

| Item | Estado | Onde |
|---|---|---|
| Pacotes multimídia (carrossel, reel, stories, LinkedIn, podcast, YouTube, referências) | 114 pacotes, 001 a 114 | `pacotes/` |
| Legendas e agenda | 114 pastas e 114 linhas, de 2026-10-05 a 2027-01-27, todas "aguardando arte/vídeo e agendamento manual", nenhuma bloqueada | `agendamento/` |
| Rascunhos revisados | 114 pautas ligadas aos pacotes, todas com `revisaoMedica: aprovada` | `pautas/pautas.json` |
| Carrosséis animados (HTML5, 4:5, 1080 x 1350) | 114, com `prefers-reduced-motion` respeitado | `carrosseis/` |
| Narração dos carrosséis | 1.107 falas (uma por slide); Francisca nos 28 sensíveis, Antônio nos 86; trilha de fundo nos 114 | `interativos/assets/audio/` |
| Artigos do portal com áudio narrado | 251 de 251, voz do Antônio com trilha de fundo a -22 dB | portal (Blob) |
| Referências dos Lotes 81 a 114 | 77, com PMID e DOI conferidos no PubMed, **mantidas** por decisão do Dr. Antônio Felipe | `CURADORIA_REFERENCIAS_081_114.csv` |
| LinkedIn dos pacotes 001 a 006 | 6, aprovados | `REVISAO_LINKEDIN_001_006.md` |
| Testes automáticos | 202 passando | `tests/unit/` |

## 2. Conformidade CFM e segurança

- **Assinatura médica** (3 linhas nas redes, 5 linhas no portal, sempre com "NÃO ESPECIALISTA" no portal), CRM-BA 41322 e RQE 26638, em todas as peças; nenhuma apresenta o médico como psiquiatra. Verificação automática (`checarEticaCfm`) sem falhas nas peças dos 114 pacotes.
- **Nota de transparência de IA (Res. CFM 2.454/2026)** no rodapé das quatro páginas públicas (início, blog, artigo e Instagram), protegida por teste contra o texto oficial.
- **Medicamentos:** nenhuma peça pública cita medicamento, classe, dose ou via; os marcadores de dose dos rascunhos foram resolvidos por redação sem posologia.
- **Temas sensíveis (28 pacotes):** CVV 188, SAMU 192 e RAPS (UBS e CAPS) nas peças, sem quadro que peça relato pessoal.
- **Protocolos locais:** o aviso de que a orientação é geral e respeita os protocolos locais acompanha o conteúdo clínico.
- **Código preservado e o que mudou:** `client_secret.json` e a pasta `scripts/` não foram alterados neste ciclo. **A checagem de hash da narração e a ferramenta de narração foram alteradas, a pedido, para permitir a voz por artigo** (PRs #48 e #50: `backend/lib/narracao.js`, `backend/routes/midia.js`, `backend/tools/narrar-artigos.js`). O comportamento anterior é mantido quando nenhuma voz é informada (voz padrão Antônio, mesmo hash de antes), e há testes cobrindo as duas situações. Também mudaram `public/artigo.html`, `index.html`, `blog.html` e `instagram.html` (só o rodapé, com a nota de IA) e o motor dos carrosséis (`CarrosselAnimado.js` e `AudioPlayer.js`, para a narração, a trilha e o modo de revisão).

## 3. Homologação

As três frentes (artigos com trilha, carrosséis, vozes) foram **homologadas por instrução do Dr. Antônio Felipe em 2026-10-06**, no estado em que estão no ar. A escuta é responsabilidade do médico; **o assistente não ouviu os áudios**. Detalhes, evidências e limites: `PROTOCOLO_HOMOLOGACAO_MULTIMIDIA.md`.

## 4. Relatórios de referência

- `RELATORIO_FECHAMENTO_CICLO_CONFORMIDADE_AUDIO.md`: nota de IA, áudios, vozes, trilha e decisões do ciclo.
- `PROTOCOLO_HOMOLOGACAO_MULTIMIDIA.md`: checagem técnica das três frentes e homologação.
- `INDICE_GERAL_ACERVO_001_114.md`: uma linha por pacote, com as pendências da auditoria.
- `RELATORIO_SANEAMENTO_REFERENCIAS_081_100.md` e `..._101_114.md`: como as referências foram localizadas.
- `ROTEIRO_ESCUTA_CARROSSEIS.md`: roteiro de escuta e como alternar a voz com `?revisao=1`.

## 5. Backup dos áudios: tripla redundância (2026-10-06)

Os MP3 de `narracoes-geradas/` (versões só de voz, versões com trilha e as vozes Francisca e Thalita dos 17 artigos) **não estão no repositório de propósito**. Em 2026-10-06 foi feito um backup compactado deles, com **837 arquivos (495 MB)**, e ele existe hoje em **três lugares**:

| # | Cópia | Local | Verificação |
|---|---|---|---|
| 1 | Disco principal | `C:\DRSAUDEMENTALackupsackup_narracoes_audio_2026-10-06.zip` | origem do backup; `testzip` OK, 837 arquivos, tamanhos e amostra de 25 hashes conferidos |
| 2 | Outro disco da máquina | `E:ackups-drsaudementalackup_narracoes_audio_2026-10-06.zip` | SHA-256 idêntico ao da cópia 1; `testzip` OK |
| 3 | Google Drive (fora da máquina) | pasta `backups-drsaudemental/` do Drive do Dr. Antônio Felipe | MD5 idêntico ao das cópias locais; tamanho exato; `rclone check` com 0 diferenças |

- **Identificadores do arquivo:** tamanho 518.892.555 bytes; SHA-256 `7630441c65238c039fab4722b21c96c02f7197a612aca66d046ab0d328e64481`; MD5 `1e6dbd10b14a1ce2b043c346942d2eee` (o Drive guarda só o MD5).
- **Envio ao Drive:** feito com o `rclone` (instalado pelo `winget`), com o acesso restrito `drive.file`, em que o programa só enxerga o que ele mesmo enviou. O envio repetiu uma passada sozinho perto do fim (retentativa normal), terminou sem erro e sem duplicar o arquivo.
- **Credencial:** o acesso do `rclone` fica em `%APPDATA%cloneclone.conf`, **fora do repositório**. Para revogar, use a página de segurança da conta Google (permissões de apps de terceiros).
- **Aviso do `rclone`:** o acesso compartilhado dele com o Google será aposentado ainda em 2026; backups futuros podem exigir uma credencial própria. O envio de hoje não foi afetado.
- **O que o backup não cobre:** áudios gerados depois de 2026-10-06. Para atualizá-lo, repetir o processo (compactar, copiar para `E:` e para o Drive, e conferir o hash).
- **Como restaurar:** baixar o zip de qualquer uma das três cópias, conferir o hash e extrair em `narracoes-geradas/`.

## 6. Como reverter

- **Áudios dos artigos:** as versões só com voz e as vozes Francisca e Thalita dos 17 artigos estão em `narracoes-geradas/` (fora do Git, só nesta máquina). O reenvio de qualquer uma é possível a qualquer momento.
- **Voz de um carrossel sensível:** trocar `voiceover-francisca/` por `voiceover/` no campo `voiceovers` do HTML (os arquivos do Antônio foram mantidos).
- **Trilha de um carrossel:** remover o campo `bgm` do HTML.

## 7. Limites e pendências conhecidas

- **Backup dos áudios:** existe em três cópias (seção 5); o que não está coberto são os áudios gerados depois de 2026-10-06, e o Drive depende de um acesso do `rclone` que pode precisar de credencial própria no futuro.
- **Trilha:** sintética e original, não uma faixa licenciada; mantida por decisão do médico.
- **Provedor dos 4 artigos mais antigos** (`burnout-aps`, `professores-saude-mental`, `psicofarmacos-mitos-culturais`, `tmc-aps`): registrados como `edge`, sem confirmação do provedor original; é só metadado.
- **Navegador:** os artigos foram conferidos pelo HTML e por amostra, e os carrosséis foram abertos no navegador ao longo do dia.
- **Artigo 155 (ciberbullying contra professores):** tem só uma referência parcial (assédio online contra docentes universitários), mantida pelo médico.
- **Pacotes 001 a 021:** são crônicas e não têm seção de referências.
- **Sete pacotes legados sem numeração:** ficam em `pacotes/especiais/`, fora da agenda.
- **Nada foi publicado nem agendado nas redes**: as linhas da agenda aguardam arte, vídeo e agendamento manual.
