# Google Search Console: passo a passo para autorizar (sem segredo no chat)

Vale a regra do CLAUDE.md: nenhuma chave entra no chat, no repositório ou no `.env` que eu leio. O arquivo de credenciais fica fora do projeto.

## O que você faz (uma vez, no navegador)

1. Entre no [Google Cloud Console](https://console.cloud.google.com) com a conta dona do site no Search Console.
2. Crie um projeto novo, chamado por exemplo `drsaudemental-gsc`. O projeto é só um recipiente para o acesso à API; não é o site.
3. Em **APIs e serviços → Biblioteca**, procure "Google Search Console API" e clique em **Ativar**.
4. Em **IAM e administração → Contas de serviço**, clique em **Criar conta de serviço**. Dê um nome, por exemplo `leitor-gsc`. Não precisa de papel no projeto.
5. Abra a conta criada, vá em **Chaves → Adicionar chave → Criar nova chave → JSON**. O arquivo baixa sozinho.
6. **Mova o arquivo JSON para fora do projeto**, por exemplo `C:\Users\A.FELIPE\.config\drsaudemental\gsc.json`. Não o coloque em `C:\DRSAUDEMENTAL`.
7. Copie o e-mail da conta de serviço (termina em `.iam.gserviceaccount.com`).
8. No [Search Console](https://search.google.com/search-console), abra a propriedade do site, vá em **Configurações → Usuários e permissões → Adicionar usuário**, cole o e-mail da conta de serviço e dê permissão de **leitura completa** (ou "restrita", que já basta para leitura de dados).
9. Me passe **apenas** o caminho do arquivo e o nome da propriedade (por exemplo `https://www.drantoniofelipemedico.com.br/`), nunca o conteúdo do JSON.

## O que eu faço depois

- Configuro a leitura com a conta de serviço (só leitura de `searchanalytics`), guardando o caminho do arquivo fora do repositório.
- Faço um teste que lê 28 dias de consultas e páginas, sem gravar nada no banco.

## Observações

- A conta de serviço só lê dados; não publica nem altera nada no site.
- Se quiser revogar o acesso, basta remover o e-mail da conta em **Usuários e permissões** e apagar a chave no Cloud Console.
- Os passos foram montados a partir de guias de terceiros sobre a API; confira contra a [documentação oficial do Google](https://developers.google.com/webmaster-tools) antes de seguir.
