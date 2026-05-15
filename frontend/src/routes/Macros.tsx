import { Wand2, BookOpen, Plus } from 'lucide-react';
import { Button, Card, CardTitle, CardDescription, Badge } from '../design';
import './Macros.css';

export function MacrosRoute() {
  return (
    <div className="macros">
      <div className="macros__head">
        <div>
          <h2>Macros & Recipes</h2>
          <p>Biblioteca de macros editáveis e recipes prontas dos connectors.</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />}>Nova macro</Button>
      </div>
      <div className="macros__grid">
        <Card variant="elevated" padding="lg" interactive>
          <Badge tone="info" icon={<BookOpen />}>Recipe</Badge>
          <CardTitle>Iniciar live no OBS</CardTitle>
          <CardDescription>Troca pra cena Intro, espera 2s, começa a transmissão.</CardDescription>
        </Card>
        <Card variant="elevated" padding="lg" interactive>
          <Badge tone="info" icon={<BookOpen />}>Recipe</Badge>
          <CardTitle>Modo Foco</CardTitle>
          <CardDescription>Silencia Discord, abre Spotify, snap browser à direita.</CardDescription>
        </Card>
        <Card variant="surface" padding="lg" interactive>
          <Badge tone="neutral" icon={<Wand2 />}>Sua macro</Badge>
          <CardTitle>Captura tela + Slack</CardTitle>
          <CardDescription>Screenshot, abre Slack, cola.</CardDescription>
        </Card>
      </div>
      <div className="macros__placeholder">
        Editor visual de macros chega na fase 5 (timeline + branches + cancelamento).
      </div>
    </div>
  );
}
