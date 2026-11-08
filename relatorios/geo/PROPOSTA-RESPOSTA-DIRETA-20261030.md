# Proposta de "resposta direta" para 5 artigos (GEO, 30/10/2026)

Status: PROPOSTA. Nenhum texto clínico foi alterado. Cada item vai para revisão do Dr. Antônio. Se aprovado, a inserção é feita em arquivo de `apps/plataforma-saude-mental/src/content/artigos/` com nova ordem, com hash de narração conferido antes (CLAUDE.md §D).

Regra usada: a resposta direta só reaproveita frases que já estão no texto (o Lead). Não cria dose, prazo, conduta nova nem número.

## Itens

### 1. quando-encaminhar-aps
- Local: logo após o `<Lead>`, antes do primeiro `<p>`.
- Proposta: "Encaminhar tudo para o especialista sobrecarrega a rede e tira do paciente o cuidado contínuo que só a APS oferece; deixar de encaminhar casos complexos também causa dano. O ponto de equilíbrio pede critérios clínicos, não só intuição."
- Base: Lead do texto atual.

### 2. burnout-aps
- Proposta: "Burnout é o esgotamento que pode atingir médicos e enfermeiros da Atenção Primária, que têm riscos próprios. Reconhecê-lo cedo protege o profissional e a qualidade do cuidado."
- Base: Lead do texto atual.

### 3. benzodiazepinicos-uso-cronico-riscos
- Proposta: "O alívio rápido dos benzodiazepínicos é justamente o que torna o uso prolongado sem acompanhamento arriscado."
- Base: Lead do texto atual.
- Atenção (decisão clínica): o texto atual não diz o que fazer em caso de uso prolongado. Se o Dr. quiser acrescentar uma frase de conduta ("procure o médico que acompanha você antes de mudar a dose"), isso é mudança de sentido clínico e precisa de OK à parte.
- Atenção (dado): `publicadoEm` está em 2026-11-15, data futura em relação a hoje (30/10/2026). Confirmar se é agendamento ou erro antes de publicar.

### 4. primeira-consulta-saude-mental
- Proposta: "Na primeira consulta em saúde mental, o médico ouve a sua história e os sintomas para entender o que está acontecendo. Saber o que esperar reduz a ansiedade desse primeiro passo."
- Base: Lead do texto atual.

### 5. saude-mental-idoso
- Proposta: "Depressão e ansiedade em idosos costumam passar despercebidas, porque os sintomas são atribuídos à idade ou a doenças físicas. Sofrimento psíquico não é parte inevitável do envelhecimento."
- Base: Lead do texto atual.

## Checagem feita nesta proposta
- Técnica: 5 slugs existem em `src/content/artigos/` (leitura só do cabeçalho e do Lead).
- Ética/humanizada: frases em linguagem simples, sem culpa, sem promessa de cura, sem paciente identificável.
- Científica: nenhuma afirmação nova com número. A referência já existe no corpo do texto.
- Auditoria completa (`npm run auditoria`) e tripla checagem NÃO foram rodadas para estes itens, porque nada foi gravado. Devem rodar antes de qualquer inserção.

## Decisões para o Dr. Antônio
1. Aprovar ou ajustar as 5 frases acima (ou mandar outra redação).
2. Benzodiazepínicos: confirmar a data de publicação (2026-11-15) e decidir se quer uma frase de conduta, que é mudança de sentido clínico.
3. Quando a resposta direta for aprovada, a inserção vai para o `.mdx` (fonte do app Next) em PR próprio; o mesmo texto não deve ser colado em `backend/data/` (narração).
