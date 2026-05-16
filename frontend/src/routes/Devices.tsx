import { useState } from 'react';
import { Plus, Cpu, Wand2 } from 'lucide-react';
import { Button, Card, CardTitle, CardDescription, Badge } from '../design';
import { LearnWizard } from '../features/learn-wizard/LearnWizard';
import { useApp } from '../state/store';
import './Devices.css';

export function DevicesRoute() {
  const devices = useApp((s) => s.devices);
  const activeId = useApp((s) => s.activeDeviceId);
  const ports = useApp((s) => s.midiInputPorts);
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="devices">
      <div className="devices__head">
        <div>
          <h2>Controladores</h2>
          <p>O app aprende seu controlador apertando os pads, knobs e teclas. Funciona com qualquer MIDI USB.</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setWizardOpen(true)}>
          Adicionar device
        </Button>
      </div>

      <Card variant="glass" padding="lg">
        <CardTitle>Portas MIDI detectadas</CardTitle>
        <CardDescription>O backend escaneia automaticamente.</CardDescription>
        <div className="devices__ports">
          {ports.length === 0 ? (
            <span className="muted">Nenhuma porta MIDI conectada.</span>
          ) : (
            ports.map((port) => <Badge key={port} tone="info">{port}</Badge>)
          )}
        </div>
      </Card>

      <div className="devices__grid">
        {devices.length === 0 ? (
          <div className="devices__empty">
            <h3>Sem devices ainda</h3>
            <p>Clique em "Adicionar device" pra rodar o Wizard de Learn — o app vai escutar o MIDI e montar o layout sozinho.</p>
          </div>
        ) : (
          devices.map((device) => (
            <Card key={device.id} variant="elevated" padding="lg" glow={device.id === activeId}>
              <div className="devices__card-head">
                <span className="devices__card-icon"><Cpu size={18} /></span>
                <div>
                  <CardTitle>{device.name}</CardTitle>
                  <CardDescription>{device.controls.length} controles · {device.author || 'sem autor'}</CardDescription>
                </div>
                {device.id === activeId ? <Badge tone="success">Ativo</Badge> : null}
              </div>
              <div className="devices__card-actions">
                <Button size="sm" variant="secondary" icon={<Wand2 size={12} />} onClick={() => setWizardOpen(true)}>
                  Re-aprender
                </Button>
                <Button size="sm" variant="ghost">Renomear</Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <LearnWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
