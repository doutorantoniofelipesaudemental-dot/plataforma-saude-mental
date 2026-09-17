# Reels Automation — Dr. Saúde Mental

Pipeline completo de geração e publicação automática de **Reels faceless**
(sem rosto aparecendo — narração + imagens de apoio) para o Instagram do Dr.
Saúde Mental.

```
Roteiro (Ollama)  ->  Narração (Edge-TTS)  ->  Legendas sincronizadas (WhisperX)
      -> Imagens (Stable Diffusion)  ->  Montagem (MoviePy)  ->  Publicação (Instagram)
```

> **Subprojeto isolado.** Esta pasta vive dentro do monorepo `DRSAUDEMENTAL`
> mas tem seu próprio `requirements.txt`, `.env` e virtualenv — não mexe nos
> arquivos da raiz. A publicação final **reaproveita** os scripts que já
> existem na raiz (`publicar_instagram.py` e `post_instagram.py`) em vez de
> duplicar a lógica de Graph API / Composio.

---

## Por que essas ferramentas

| Etapa | Ferramenta | Papel |
|---|---|---|
| Roteiro | **Ollama** (local, `deepseek-r1:8b`) | Gera narração, prompts de imagem e legenda a partir de um tema ou de uma linha de `../30_REELS_FACELESS.csv`, seguindo a voz de marca clínico-acolhedora. |
| Narração | **Edge-TTS** | Converte a narração em áudio com voz neural pt-BR, sem custo e sem chave de API. |
| Legendas | **WhisperX** | Transcreve o áudio e alinha cada palavra a um timestamp exato — é o que permite legendas "estilo Reels" realmente sincronizadas, não só por frase. |
| Imagens | **Stable Diffusion** (AUTOMATIC1111 ou `diffusers`) | Gera uma imagem por cena/prompt do roteiro. |
| Montagem | **MoviePy** | Junta imagens (com efeito Ken Burns), narração e legendas queimadas em um `.mp4` vertical 1080×1920. |
| Publicação | **Instagram Graph API** (`publicar_instagram.py`) ou **Composio** (`post_instagram.py`) | Publica o Reel — reaproveita os scripts já existentes na raiz do repo. |
| Notificação (opcional) | **Composio** | Avisa (email/Slack/etc.) quando o pipeline termina ou falha — desligado por padrão. |

---

## Estrutura

```
reels_automation/
├── README.md
├── requirements.txt
├── settings.json            Configuração central (modelos, vozes, resolução, etc.)
├── .env.example             Variáveis de ambiente deste subprojeto
├── main.py                  CLI de entrada
├── src/
│   ├── config.py             Carrega settings.json + .env + ../.env.local (raiz)
│   ├── logger.py             Logging em console + logs/pipeline.log + logs/errors.log
│   ├── utils.py               PipelineError, retry, slugify, subprocess helper
│   ├── llm_ollama.py          Geração de roteiro via Ollama (+ leitura do CSV)
│   ├── tts_edge.py            Narração via Edge-TTS
│   ├── transcribe_whisperx.py Transcrição + alinhamento + legendas (.srt/.json)
│   ├── image_gen_sd.py        Geração de imagens (AUTOMATIC1111 ou diffusers)
│   ├── video_builder.py       Montagem final com MoviePy
│   ├── composio_actions.py    Notificações opcionais via Composio
│   ├── instagram_bridge.py    Ponte para publicar_instagram.py / post_instagram.py
│   └── pipeline.py            Orquestra todas as etapas (run-all)
├── scripts/
│   ├── install.ps1            Cria venv, instala deps, checa ffmpeg/ImageMagick/Ollama
│   ├── run_pipeline.ps1        Roda o pipeline completo
│   ├── clean.ps1               Limpa artefatos gerados
│   └── schedule_task.ps1       Cria/remove uma Tarefa Agendada do Windows
├── assets/
│   ├── input/                 Insumos manuais (ex.: imagens próprias, se quiser pular a SD)
│   ├── audio/                 Áudios de narração avulsos (comandos individuais)
│   ├── images/                Imagens avulsas
│   ├── captions/              Legendas avulsas
│   ├── output/                Vídeos/roteiros avulsos
│   └── runs/<run_id>/          Artefatos de cada execução do `run-all` (roteiro, áudio, legendas, imagens, vídeo final)
├── logs/
│   ├── pipeline.log            Log completo (DEBUG+)
│   └── errors.log              Só erros (ERROR+)
└── tests/
    └── test_smoke.py           Testes rápidos, sem chamar nenhum serviço externo
```

---

## Pré-requisitos

Instale antes de rodar `scripts/install.ps1`:

1. **Python 3.11, 3.12 ou 3.13** (não 3.14 — veja nota abaixo) — [python.org](https://www.python.org/downloads/) ou `winget install Python.Python.3.12`
2. **ffmpeg** — `winget install Gyan.FFmpeg` (necessário pro MoviePy exportar vídeo)
3. **Microsoft Visual C++ Redistributable (x64)** — `winget install Microsoft.VCRedist.2015+.x64` (necessário pro torch/whisperx carregarem suas DLLs nativas no Windows)
4. **Ollama** — [ollama.com/download](https://ollama.com/download), depois:
   ```powershell
   ollama pull deepseek-r1:8b
   ollama serve
   ```
   (o repo já usa esse modelo em `../config.yaml` via litellm — reaproveitado aqui.)
5. **Stable Diffusion** — escolha um backend em `settings.json > stable_diffusion.backend`:
   - `automatic1111` (padrão): veja `tools/README.md` — já está instalado e configurado localmente nesta máquina, com todos os ajustes necessários para rodar em Python 3.12/CPU documentados lá.
   - `diffusers`: não precisa de WebUI, mas baixa e carrega o modelo (pesado) no próprio processo Python — exige GPU NVIDIA para ser viável na prática.

   > **CPU sem GPU dedicada é lento de verdade:** nesta máquina (sem CUDA, 12 GB
   > de RAM), uma imagem 384×512 a 8 steps levou ~2 minutos via API do
   > AUTOMATIC1111. Nas configurações de produção do `settings.json`
   > (1080×1920, 30 steps) espere algo da ordem de **dezenas de minutos por
   > imagem** — com várias cenas por Reel, rodar `run-all` pode levar horas.
   > Para iterar rápido durante testes, baixe temporariamente
   > `stable_diffusion.width`/`height`/`steps` no `settings.json` (ex.:
   > 512×768, 10 steps) e só suba para os valores de produção na geração final.
6. Credenciais do Instagram/Composio/Vercel Blob já configuradas em `../.env.local` (na raiz do repo) — este pipeline **não** duplica essas variáveis, só chama os scripts que já as usam.

> **Sobre o Python 3.14:** o WhisperX depende de `ctranslate2`/`faster-whisper`/
> `pyannote.audio`, que costumam demorar meses para ganhar build pronta em
> versões novas do Python. `scripts/install.ps1` detecta automaticamente uma
> instalação de Python 3.11/3.12/3.13 via `py launcher` e a usa para criar o
> venv, mesmo que o `python` padrão do PATH seja 3.14 — só instale uma dessas
> versões (ex.: `winget install Python.Python.3.12`) se ainda não tiver.
>
> **TextClip usa Pillow, não ImageMagick:** a partir do MoviePy 2.x, a
> renderização de texto/legendas não depende mais do ImageMagick — usa
> Pillow (já incluso no `requirements.txt`) com uma fonte `.ttf`/`.otf` local
> (padrão: `C:\Windows\Fonts\arialbd.ttf`, configurável em
> `settings.json > video.caption_font`).

---

## Instalação

```powershell
cd C:\DRSAUDEMENTAL\reels_automation
.\scripts\install.ps1
```

Isso cria um virtualenv em `.venv\`, instala `requirements.txt`, copia
`.env.example` para `.env` e verifica se `ffmpeg`, `magick` e `ollama` estão
no PATH (e se o Ollama está respondendo em `localhost:11434`).

Revise o `.env` gerado — os valores padrão já apontam para um Ollama/SD/WhisperX
rodando localmente na própria máquina.

---

## Uso

### Pipeline completo (roteiro → publicação)

```powershell
# A partir de um tema livre
.\scripts\run_pipeline.ps1 -Tema "ansiedade no trabalho"

# A partir de uma linha do calendário (../30_REELS_FACELESS.csv)
.\scripts\run_pipeline.ps1 -Numero 3

# Gerar e publicar via Graph API direta
.\scripts\run_pipeline.ps1 -Tema "burnout" -Publicar -Metodo graph

# Gerar e publicar via Composio (post_instagram.py gera a legenda com Claude)
.\scripts\run_pipeline.ps1 -Tema "burnout" -Publicar -Metodo composio

# Gerar tudo mas não publicar (revisar antes)
.\scripts\run_pipeline.ps1 -Tema "burnout" -Publicar -DryRun
```

Cada execução grava seus artefatos em `assets/runs/<timestamp>/`:
`roteiro.json`, `narracao.mp3`, `legendas.srt`, `legendas.json`,
`imagens/cena_01.png...`, e o vídeo final `<slug>.mp4`.

### Etapas isoladas (via `main.py`, útil para depurar uma etapa específica)

```powershell
.venv\Scripts\python.exe main.py roteiro --tema "sono e saude mental"
.venv\Scripts\python.exe main.py narracao --texto "Texto de teste." --saida assets/output/teste.mp3
.venv\Scripts\python.exe main.py legendas --audio assets/output/teste.mp3
.venv\Scripts\python.exe main.py imagens --prompts "cena 1" "cena 2" --saida-dir assets/images/teste
.venv\Scripts\python.exe main.py video --imagens-dir assets/images/teste --audio assets/output/teste.mp3 --legendas assets/captions/teste.json --saida assets/output/final.mp4
.venv\Scripts\python.exe main.py publicar --video assets/output/final.mp4 --slug meu-slug --legenda "Legenda final..." --metodo graph
```

### Agendamento diário

```powershell
.\scripts\schedule_task.ps1 -Numero 1 -Publicar -Metodo graph -Hora "09:00"
.\scripts\schedule_task.ps1 -Remover   # desativa a tarefa
```

### Limpeza de artefatos

```powershell
.\scripts\clean.ps1              # pede confirmação
.\scripts\clean.ps1 -Confirmar   # sem prompt
.\scripts\clean.ps1 -Logs -Confirmar   # também limpa logs\*.log
```

---

## Como a publicação funciona (reaproveitando a raiz do repo)

O Instagram só aceita mídia hospedada em URL pública HTTPS — nunca um
caminho local. Por isso `instagram_bridge.py` não fala direto com a Graph API
nem com a Composio: ele encadeia os scripts que já resolvem isso na raiz do
repositório:

1. Copia o `.mp4` final para `../carrosseis-instagram/<slug>/reel.mp4`
   (mesma convenção de pasta usada pelos carrosséis existentes).
2. Roda `python ../preparar_midia_publica.py <slug> --formato midias`, que
   sobe o vídeo para o Vercel Blob e devolve a URL pública.
3. Publica com:
   - **`graph`** (padrão): `python ../publicar_instagram.py reels --video-url <url> --legenda "..."` (Meta Graph API direta, fluxo de 2 etapas: container → publish).
   - **`composio`**: `python ../post_instagram.py publicar --media-url <url> --tema "..." --tipo-midia video` (Composio + Claude gerando a legenda).

Isso evita reimplementar renovação de token de longa duração, polling de
status do container e upload para o Blob — tudo isso já existe e está testado
na raiz do repo.

---

## Tratamento de erros e logs

- Toda etapa (`llm_ollama`, `tts_edge`, `transcribe_whisperx`, `image_gen_sd`,
  `video_builder`, `instagram_bridge`) levanta `PipelineError` com uma
  mensagem específica de causa provável (ex.: "Ollama não está rodando",
  "ffmpeg não encontrado", "AUTOMATIC1111 sem --api").
- Chamadas de rede instáveis (Ollama, Edge-TTS, Stable Diffusion) têm retry
  automático com backoff exponencial (`src/utils.py::with_retry`).
- A geração de imagens **não aborta** o pipeline se uma cena específica falhar
  após todas as tentativas — ela é pulada e o vídeo é montado com as imagens
  que deram certo (falha só se **nenhuma** imagem for gerada).
- Cada execução do `main.py` grava em `logs/pipeline.log` (tudo, nível DEBUG)
  e `logs/errors.log` (só erros), com rotação automática (5 MB × 5 arquivos).
- Se `composio.notify_on_failure` estiver ligado em `settings.json`, uma
  falha em qualquer etapa dispara uma notificação via Composio antes de
  propagar o erro.

---

## Testes

```powershell
.venv\Scripts\python.exe -m pytest tests\ -v
```

Os testes em `tests/test_smoke.py` não chamam Ollama, Stable Diffusion,
WhisperX, Edge-TTS nem Instagram — validam só config, parsing de JSON do LLM,
agrupamento de legendas e slugify. Para validar o pipeline de ponta a ponta,
rode `run_pipeline.ps1 -DryRun` de verdade contra os serviços locais.

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Falha ao chamar o Ollama` | `ollama serve` não está rodando, ou o modelo não foi baixado | `ollama serve` em outro terminal; `ollama pull deepseek-r1:8b` |
| `Falha ao chamar a API do AUTOMATIC1111` | WebUI não iniciado com `--api`, ou porta errada | Inicie o WebUI com `webui-user.bat` editado para incluir `--api`; confira `SD_API_URL` no `.env` |
| `Falha ao renderizar legenda com MoviePy` / fonte não encontrada | `video.caption_font` aponta pra um arquivo que não existe | Confirme que `C:\Windows\Fonts\arialbd.ttf` existe, ou aponte `caption_font` pra outra fonte `.ttf`/`.otf` instalada |
| `ffmpeg não encontrado no PATH` | ffmpeg não instalado | `winget install Gyan.FFmpeg` e reabra o terminal |
| `[WinError 126] ... c10.dll` ao importar `torch`/`diffusers`/`whisperx` | Falta o Microsoft Visual C++ Redistributable (x64) | `winget install Microsoft.VCRedist.2015+.x64` e reabra o terminal |
| `numpy`/`ctranslate2` tentam compilar do zero (erro do Meson/`cl.exe` não encontrado) | O Python ativo é mais novo que as libs do pipeline têm wheel pronta (ex.: 3.14) | Rode `scripts/install.ps1` — ele detecta e usa Python 3.11/3.12/3.13 via `py launcher` automaticamente |
| `Falha ao carregar o modelo de alinhamento do WhisperX` | Falta aceitar os termos do modelo no Hugging Face, ou falta `HUGGINGFACE_TOKEN` | Acesse o modelo pyannote indicado no erro, aceite os termos, gere um token em huggingface.co/settings/tokens e coloque em `HUGGINGFACE_TOKEN` no `.env` |
| `preparar_midia_publica.py nao devolveu nenhuma URL` | `BLOB_READ_WRITE_TOKEN` ausente/inválido em `../.env.local` | Gere o token no dashboard da Vercel (Storage → Blob) e preencha na raiz do repo |
| `publicar_instagram.py rodou mas nao confirmou media_id` | Token do Instagram expirado, ou vídeo rejeitado pela Meta | Rode `python ../publicar_instagram.py renovar-token`; confira `logs/pipeline.log` para o erro completo vindo da Meta |

---

## Variáveis de ambiente

Ver `.env.example` para a lista completa deste subprojeto (Ollama, Stable
Diffusion, WhisperX, Edge-TTS). As credenciais de publicação
(`INSTAGRAM_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN`, `BLOB_READ_WRITE_TOKEN`,
`COMPOSIO_API_KEY`, `ANTHROPIC_API_KEY`) continuam só em `../.env.local`, na
raiz do repositório.
