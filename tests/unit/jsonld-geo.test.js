// Frente 2 (GEO, 30/10/2026): valida o JSON-LD gerado (sintaxe e campos obrigatórios) e a página /sobre.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { montarJsonLdArtigo, serializarJsonLd, validarJsonLd, extrairFaq, BASE_URL } = require('../../backend/lib/jsonLdGeo');
const { hashConteudo, aprovar } = require('../../backend/lib/revisaoMedica');

const RAIZ = path.join(__dirname, '..', '..');
const artigoBase = {
  slug: 'exemplo-texto',
  titulo: 'Exemplo de texto',
  resumo: 'Resumo curto do texto de exemplo.',
  publicadoEm: '2026-10-01T10:00:00.000Z',
  atualizadoEm: '2026-10-20T10:00:00.000Z',
  conteudo: '<p>Corpo do texto sem perguntas.</p>',
  imagemCapa: 'https://example.com/capa.jpg',
};
const conteudoComFaq = `<p>Corpo.</p>
<h2>Perguntas frequentes</h2>
<h3>Quando procurar ajuda?</h3>
<p>Quando o sofrimento atrapalha o dia a dia. Em crise, ligue 188.</p>
<h3>Isso substitui consulta?</h3>
<p>Não. Este texto é educativo e geral.</p>
<h2>Referências</h2>
<h3>Não é pergunta</h3>
<p>Nao deve entrar.</p>`;

test('gera MedicalWebPage + Article e nenhum FAQPage sem FAQ real', () => {
  const j = montarJsonLdArtigo({ artigo: artigoBase });
  const tipos = j['@graph'].map((n) => n['@type']);
  assert.ok(tipos.includes('MedicalWebPage'));
  assert.ok(tipos.includes('Article'));
  assert.ok(!tipos.includes('FAQPage'));
  assert.deepEqual(validarJsonLd(j), []);
});

test('FAQPage só com perguntas da seção "Perguntas frequentes" (h3 com ponto de interrogação)', () => {
  const j = montarJsonLdArtigo({ artigo: { ...artigoBase, conteudo: conteudoComFaq } });
  const faq = j['@graph'].find((n) => n['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage deveria existir');
  assert.equal(faq.mainEntity.length, 2);
  assert.equal(faq.mainEntity[0].name, 'Quando procurar ajuda?');
  assert.match(faq.mainEntity[0].acceptedAnswer.text, /188/);
  assert.deepEqual(validarJsonLd(j), []);
});

test('reviewedBy só com revisão aprovada e hash igual ao texto atual', () => {
  const semRegistro = montarJsonLdArtigo({ artigo: artigoBase });
  assert.ok(!JSON.stringify(semRegistro).includes('reviewedBy'));

  const hash = hashConteudo(artigoBase.conteudo);
  const registro = aprovar({ slug: artigoBase.slug, hash, revisor: 'Dr. Antônio Felipe Garabito', data: '2026-10-25T12:00:00Z' });
  const comRevisao = montarJsonLdArtigo({ artigo: artigoBase, registroRevisao: registro, hashAtual: hash });
  const pagina = comRevisao['@graph'].find((n) => n['@type'] === 'MedicalWebPage');
  assert.equal(pagina.reviewedBy.name, 'Dr. Antônio Felipe Garabito');

  const textoMudou = montarJsonLdArtigo({ artigo: artigoBase, registroRevisao: registro, hashAtual: hashConteudo('outro') });
  assert.ok(!JSON.stringify(textoMudou).includes('reviewedBy'), 'aprovação antiga não pode valer para texto alterado');
});

test('serialização é JSON válido e não fecha a tag script', () => {
  const artigo = { ...artigoBase, resumo: 'Texto com </script> dentro' };
  const s = serializarJsonLd(montarJsonLdArtigo({ artigo }));
  assert.ok(!s.includes('</script>'));
  const volta = JSON.parse(s);
  assert.equal(volta['@context'], 'https://schema.org');
  assert.deepEqual(validarJsonLd(volta), []);
});

test('validador acusa campo obrigatório ausente e FAQ vazio', () => {
  const j = montarJsonLdArtigo({ artigo: artigoBase });
  const sem = JSON.parse(JSON.stringify(j));
  delete sem['@graph'].find((n) => n['@type'] === 'Article').headline;
  assert.ok(validarJsonLd(sem).some((e) => e.includes('headline')));
  const faqVazio = { ...j, '@graph': [...j['@graph'], { '@type': 'FAQPage', mainEntity: [] }] };
  assert.ok(validarJsonLd(faqVazio).some((e) => e.includes('FAQPage')));
});

test('extrairFaq ignora h3 fora da seção de perguntas e URLs usam o domínio principal', () => {
  assert.equal(extrairFaq('<h3>Algo?</h3><p>x</p>').length, 0);
  assert.equal(extrairFaq(conteudoComFaq).length, 2);
  const j = montarJsonLdArtigo({ artigo: artigoBase });
  assert.ok(j['@graph'][0].url.startsWith(BASE_URL));
});

test('página /sobre: assinatura de 5 linhas com NÃO ESPECIALISTA logo após as pós-graduações, sem wa.me', () => {
  const rodape = fs.readFileSync(path.join(RAIZ, 'apps/plataforma-saude-mental/app/RodapeIdentificacao.jsx'), 'utf8');
  const sobre = fs.readFileSync(path.join(RAIZ, 'apps/plataforma-saude-mental/app/sobre/page.js'), 'utf8');
  assert.match(rodape, /CRM-BA 41322/);
  assert.match(rodape, /RQE 26638/);
  assert.match(rodape, /'Pós-graduação em [^\n]*',\n\s*'NÃO ESPECIALISTA',/, 'NÃO ESPECIALISTA logo após a linha das pós-graduações');
  assert.match(rodape, /Terapia Cognitivo-Comportamental/);
  assert.ok(sobre.includes('RodapeIdentificacao'), 'a página usa o bloco oficial uma única vez');
  assert.ok(!/CRM-BA|RQE/.test(sobre), 'o corpo da página não repete CRM/RQE');
  assert.ok(!/wa\.me|whatsapp/i.test(sobre));
  assert.ok(!/psiquiatra\b/i.test(sobre.replace(/psiquiatria/gi, '')), 'não apresentar como psiquiatra');
});
