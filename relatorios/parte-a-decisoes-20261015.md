# Parte A — decisões aprovadas (15/10/2026)

Backup: `backups/editorial2-20261015-1710/` (9 documentos do Mongo + 1 .mdx). Script: `backend/scripts/corrigirEditorial2.js` (dry-run por padrão). Auditoria antes e depois: 0 falhas. Testes unitários: 235/235.

## A.1 jogos-online-criancas
- **App Next (.mdx):** tabela de classificações (NR14/NR16/NR18) removida; entrou orientação geral (acompanhar o que a criança joga, conferir a classificação indicativa na embalagem ou na loja, conversar, limitar o tempo de tela) com link do ClassInd (https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1, HTTP 200).
- **Site (Mongo):** o texto do site NÃO tinha a tabela. Só o item "respeitar a classificação indicativa" ganhou o link do ClassInd (o áudio segue `ok`: o texto narrado não mudou).
- **Proposta pendente (muda o sentido, espera OK):** no .mdx ainda restam frases apoiadas na reclassificação (título "O que mudou recentemente no Brasil", "O motivo da reclassificação de Roblox, Fortnite e Free Fire…", a citação final e a RefsNote "baseado em decisões do MJSP"). São a mesma afirmação sem fonte primária que já saiu de `jogos-online-consulta-medicos`. Sugestão: trocar pelo que o ECA Digital e o Decreto 12.880/2026 dizem.

## A.2 Selo "Narrativa composta"
Receberam (8) — há personagem, cena ou caso clínico:
| Texto | Motivo |
|---|---|
| violencia-juventude-e-homicidios | jovem de 17 anos que perdeu quatro amigos |
| violencia-sexual-na-universidade | cena da festa e do quarto |
| violencia-perdao-e-reparacao | mulher que ouviu "precisa perdoar" |
| migracao-lingua-e-cuidado | cena da consulta com a filha de 10 anos traduzindo |
| migracao-maternidade-longe-da-rede | duas mães (cena/personagens) |
| ficar-igual-a-foto-com-filtro | paciente que mostra a foto no consultório |
| parei-a-caneta-e-engordei-de-novo | relato em primeira pessoa (18 kg) |
| compulsao-alimentar-e-obesidade | relato em primeira pessoa ("como escondido") |

Não receberam (varredura de 517 textos sem selo): as aberturas são **frases-tipo ou generalizações**, sem personagem/cena/caso (ex.: "Já faz seis meses, eu deveria estar melhor?", "Homem não chora", "Quero ficar em casa", "Eles têm 14, 15, 16 anos", "Um colaborador chora…" como lista de situações, `quando-o-procedimento-da-errado`, `mutismo-seletivo`, `canetas-emagrecedoras-saude-mental-humor`, `por-que-e-dificil-emagrecer-e-manter`). Se o Dr. Antônio preferir o selo também em algum desses, é só indicar o slug.
