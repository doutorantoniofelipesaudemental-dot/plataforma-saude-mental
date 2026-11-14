# Método DrSM — produção audiovisual do Portal

Status: proposta em PR (14/11/2026). Vale quando o PR for aprovado. Decisões do Dr. Antônio, 14/11/2026 (ordem 00:15).

## Decisões (D1–D5)

- **D1 — Automação e protagonismo.** A produção é automatizada ao máximo. O Dr. Antônio não aparece: nem rosto, nem voz, nem avatar. O protagonismo é das produções (roteiro, cena, personagem, dado). Método e estilo são próprios do Portal ("Método DrSM").
- **D2 — Personagens.** PROIBIDO: fotos e vídeos realistas de seres humanos, inclusive gerados por IA. AUTORIZADO: personagens de desenho animado e anime, inclusive gerados por IA, em estilo adulto e próprio. Não imitar Pixar, Disney ou Ghibli. Sem visual infantil, sem mascote, sem voxel nem pixel. A checagem automática descarta imagem com aparência fotorrealista.
- **D3 — Ícones.** Família plana Lucide (licença ISC) em vídeos e no site. Ícones 3D (3dicons) só nas capas.
- **D4 — Geração por IA.** Só modelos com licença que permite uso comercial, rodando em nuvem gratuita:
  - Kaggle Notebooks: autorizado.
  - Cloudflare Workers AI: só após autorização escrita do Dr. ("autorizo o Cloudflare").
  - Modal: não autorizado (risco de cobrança).
  - Imagem: FLUX.1-schnell (Apache-2.0). Vídeo imagem→vídeo: Wan 2.x (Apache-2.0).
  - PROIBIDO: modelos não comerciais (ex.: FLUX.1-dev) e geradores pagos.
- **D5 — Recusados.** Apresentador, rosto ou voz do Dr.; avatar; "canal dark"; operação de vários canais; iscas "comente X"; ElevenLabs; música gerada por IA; Vox-explainer sem versão fixa; WanGP local (sem placa de vídeo); imitação de canais de terceiros.

## Regras de produção

- Vídeo final não é slide: nada de "slides estáticos" como vídeo final. Quadro inteiro é cena que se constrói com a narração.
- Ritmo de 3 a 6 s por cena; nenhuma cena parada por mais de 8 s.
- Texto na tela só como palavra-chave curta (até 6 palavras).
- Todo número tem fonte conferida no PubMed (PMID ou DOI) com trecho do resumo.
- Narração em −14 LUFS. Trilha, quando houver, em licença livre, em −22 dB (carrossel) ou −24 LUFS (vídeo curto).
- Cartela final: 5 linhas de identificação, aviso CFM 2.454/2026, "Em crise: CVV 188 · SAMU 192". Relatos: nota de ficção falada e em cartela.
- Temas de suicídio: OMS 2023. Sem método, sem local, sem suspense em torno da crise; termina com caminho de ajuda.
- Linguagem centrada na pessoa, sem promessas ("mude sua vida"), sem pedido de doação ou compartilhamento, sem sensacionalismo.
- Conteúdo não é para crianças.

## Personagens

- Ficha fixa por personagem: mesmo rosto, roupa e proporção em todas as cenas.
- Descarte automático de imagem fotorrealista ou fora do estilo.

## Portões automáticos (a implementar, com testes)

1. Roteiro: fonte, tom, aviso de ficção quando for relato.
2. Referências: PubMed (PMID/DOI) e trecho do resumo, frase a frase.
3. Ética: CFM 2.336/2023, OMS 2023, 5 linhas, CVV/SAMU.
4. Áudio: −14 LUFS, SRT presente.
5. Ritmo e legibilidade: limites de cena e de palavras.
6. Estilo: fotorrealismo descartado, ficha de personagem.
7. Miniatura e título: padrão da série.
8. Textos de cada rede: limites e aviso de IA.

Nenhum portão grava "aprovada" sozinho. A aprovação é do Dr. (ver central de aprovação).

## Não é publicação

Este documento não publica nada e não agenda nada. Publicação segue os freios de cada rede e o `merge-seguro`.
