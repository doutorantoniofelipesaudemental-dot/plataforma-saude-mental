# Radar de temas (método e primeiro calendário, 20/10/2026)

## Situação

O radar mensal depende de dados que ainda não estão conectados:
- **Google Search Console:** precisa de autorização sua (passo a passo em `relatorios/SEARCH-CONSOLE-PASSO-A-PASSO.md`). Sem ele, não há buscas reais.
- **Google Trends e sugestões do YouTube:** não há acesso programático configurado. Hoje só consigo pesquisa web pontual.

Por isso este arquivo traz o método e o calendário de campanhas. **Não traz as 20 pautas priorizadas**: elas dependeriam de dados reais, e não inventei números de busca.

## Método (fontes e cruzamento)

1. **Coleta mensal:** buscas do Search Console (consultas com impressão e clique), Trends Brasil e Bahia, sugestões do YouTube e perguntas frequentes.
2. **Cruzamento com o acervo** (`backend/lib/existeConteudo.js`, similaridade acima de 60% = já coberto):
   - **Lacuna:** tema com busca e sem texto.
   - **Atualizar:** texto existe, mas é antigo (mais de 12 meses) ou tem pouca visita.
   - **Reforçar:** tema com audiência; pede satélite ou peça nova.
3. **Saída:** `relatorios/RADAR-TEMAS-AAAA-MM.md`, com 20 pautas, público, formato e justificativa.

**Regra:** pauta com conteúdo clínico novo só vira texto depois da sua aprovação. Atualização de referência e de formato segue automática.

## Calendário de campanhas (datas fixas)

| Mês | Campanha | Tema sugerido (a validar com o acervo) |
|---|---|---|
| Janeiro | Janeiro Branco (saúde mental) | Saúde mental no dia a dia, sono e rotina |
| 2 de abril | Dia Mundial de Conscientização do Autismo | Autismo: sinais, diagnóstico e apoio |
| 18 de maio | Luta Antimanicomial | Cuidado em liberdade, CAPS, rede de atenção |
| Setembro | Setembro Amarelo (prevenção do suicídio) | Prevenção, sinais de alerta, CVV 188 e SAMU 192 |
| 10 de outubro | Dia Mundial da Saúde Mental | Tema geral da OMS do ano (conferir o tema oficial) |
| Outubro | Mês da saúde do trabalhador | Burnout, NR-1 e riscos psicossociais |

Os temas são sugestões. Antes de virar pauta, cada um passa pelo cruzamento com o acervo.

## Próximo passo

Conectar o Search Console (seu OK). Com os dados, eu gero a primeira versão do radar com as 20 pautas.
