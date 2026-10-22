/** Player da narração do texto: o mesmo markup do site (backend/lib/renderizarArtigo.js). Sem JavaScript de player. */
export default function ArtigoNarracao({ url }) {
  return (
    <div className="artigo-narracao">
      <p className="artigo-narracao__rotulo" id="rotulo-narracao">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1z" /><path d="M16 8.2a4.2 4.2 0 0 1 0 7.6" /><path d="M18.6 5.6a7.8 7.8 0 0 1 0 12.8" /></svg>
        Ouvir o artigo completo
      </p>
      <audio controls preload="none" src={url} aria-labelledby="rotulo-narracao" aria-describedby="aviso-narracao">
        Seu navegador não suporta áudio incorporado.
        <a href={url}>Baixar o áudio da narração</a>.
      </audio>
      <p className="artigo-narracao__aviso" id="aviso-narracao">Narração em voz sintética.</p>
    </div>
  );
}
