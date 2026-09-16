import { fileURLToPath } from 'node:url';
import path from 'node:path';
import createMDX from '@next/mdx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite .mdx como paginas/rotas dentro de app/ (Regra oficial do Next.js
  // para blog em MDX — ver /docs/app/guides/mdx).
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  // O projeto raiz (C:\DRSAUDEMENTAL) tem seu proprio package-lock.json (o
  // backend Express) e esta app tem o dela — sem isso o Turbopack infere a
  // raiz errada e usa a do projeto pai.
  turbopack: {
    root: __dirname,
  },
};

const withMDX = createMDX({
  options: {
    // Nomes como string (nao a funcao importada) — exigencia do Turbopack,
    // que nao aceita passar funcoes JS para o compilador em Rust.
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
