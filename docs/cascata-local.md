# Cascata local — como entrar, sair e limites (17/11/2026)

## Escolha
- **Ferramenta:** Aider 0.86.2 (`aider-chat`, PyPI, repositório oficial github.com/Aider-AI/aider), instalado em `C:\DRS-tools\aider-venv` (fora do repositório).
- **Modelo:** `qwen2.5-coder:14b` via Ollama local (`http://127.0.0.1:11434`).
- **Ordem de teste:** Claude Code (falhou: Ollama 0.40.16 não responde em `/v1/messages`) → Aider (funcionou) → OpenCode (não testado; não usado).

## Teste de 17/11
- Arquivo descartável: `C:\DRS-tools\teste-local\teste.css`, fora do repositório.
- Tarefa: mudar a cor do texto de `.botao` para `#17211f`.
- Resultado: 78 s, edição correta, nenhuma outra linha alterada.

## Como entrar
```
powershell -NoProfile -File scripts/cascata.ps1 -Modo local
```
O script inicia o Ollama se estiver parado e confere os três modelos (`codigo`, `geral`, `trivial`). Só o modelo `codigo` é usado pelo Aider.

## Como sair
Digite `/exit` no Aider. Ou use `-Modo off` para voltar ao Claude direto.

## Limites (obrigatórios)
- **Só para CSS, scripts e tarefas mecânicas** (formatação, renomear, validar JSON).
- **Nunca** para conteúdo clínico, texto de artigo, roteiro, legenda, texto de vídeo ou YouTube, nem dado de paciente. Esses vão ao Claude direto (`-Modo off`).
- **Nunca** como roteador, gateway ou proxy. Nenhuma chave de API é usada; o Aider fala só com o Ollama local.
- Não usar o Aider com Git automático: a flag `--no-auto-commits` está ativa. Commits são feitos à mão.
- Se o Ollama não responder, o modo sai com código 2 e a mensagem `indisponível`.

## Teste sem console (17/11/2026, ~06:10)
- Comando: `aider --message "..." --yes --no-git --no-auto-commits --no-check-update --no-analytics` com entrada vazia, arquivo descartável em `C:/DRS-tools/teste-local/teste.css`.
- Resultado: exit 0, 73 s, edição correta (`color:#17211f`), nenhuma outra linha alterada.
- Avisos do prompt toolkit ("Can't initialize prompt toolkit") não impedem o modo `--message`.
- **Pendência do Dr.:** o modo interativo (`-Modo local` sem `--message`) ainda precisa ser testado num PowerShell real.
