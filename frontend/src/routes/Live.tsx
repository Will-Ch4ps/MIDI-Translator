import { Activity, Gauge, Zap } from 'lucide-react';
import { Card, CardTitle, CardDescription, Badge } from '../design';
import './Live.css';

export function LiveRoute() {
  return (
    <div className="live">
      <div className="live__head">
        <div>
          <h2>Live Monitor</h2>
          <p>Tela imersiva pra performance — eventos, latência e camada ativa.</p>
        </div>
        <Badge tone="success" icon={<Activity />}>Tempo real</Badge>
      </div>
      <div className="live__grid">
        <Card variant="elevated" padding="lg">
          <Gauge size={20} />
          <CardTitle>Latência</CardTitle>
          <CardDescription>P50: 8ms · P95: 22ms — alvo &lt; 40ms.</CardDescription>
        </Card>
        <Card variant="elevated" padding="lg">
          <Zap size={20} />
          <CardTitle>Disparos / min</CardTitle>
          <CardDescription>0 — comece a tocar e os números aparecem aqui.</CardDescription>
        </Card>
      </div>
      <div className="live__placeholder">
        Modo fullscreen de performance chega na fase 6 (mapa gigante + log scroll).
      </div>
    </div>
  );
}
