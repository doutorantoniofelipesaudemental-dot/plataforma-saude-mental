> **DESATUALIZADO (29/10/2026).** O app do YouTube está "Em produção" desde 18/10/2026, conforme `relatorios/DECIDIDO.md`. O aviso de vencimento em 23/10 era falso. Este registro fica para histórico e não deve ser usado como pendência.

# YouTube: o que falta com você (19/10/2026)

Revisão de `AUDITORIA-API-RESPOSTAS.md` contra o código. As respostas NÃO foram alteradas; a decisão é sua.

1. **Legendas:** `backend/lib/operacional/youtube/postPublisher.js` envia legendas (`captions.insert`, pt-BR, quando há .srt). A seção 5 das respostas diz "captions: não usa". Decida: corrigir a resposta ou remover o envio.
2. **Chamada `videos?part=status`** (postPublisher.js, linha 39, PUT): é `videos.update`, que não está listado nas respostas. Decida se entra na lista de endpoints.
3. **Armazenamento:** confirme que nenhum dado de usuário do YouTube é gravado no banco (não verifiquei o MongoDB além dos modelos). A resposta da seção 6 diz que só há .env e o arquivo local da fila.
4. **Status do app:** "Testando", com vencimento em 23/10/2026. A reautorização (`scripts/youtube-autorizar.js`) é login e OAuth: só você.
5. **Cota:** os números da seção 5 (~1.600 por upload) são estimativa; confira no console do Google antes de enviar.
6. **Envio:** revise o formulário e clique em Enviar. Eu não envio.
7. **Vídeo de demonstração:** a resposta oferece gravação de tela do fluxo; só você pode gravar.
