import SistemaIntegradoSaudeMental from './sistema-integrado-saude-mental';

export const metadata = {
  title: 'Ferramenta Clínica',
  description:
    'Diário do paciente, escalas clínicas (PHQ-9, GAD-7, risco de suicídio), rastreio escolar SNAP-IV e rastreio de burnout ocupacional.',
};

export default function FerramentaPage() {
  return <SistemaIntegradoSaudeMental />;
}
