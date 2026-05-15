import { useState } from 'react';
import { Layers, Plus, Eye, EyeOff } from 'lucide-react';
import { Badge, Button } from '../design';
import { DeviceCanvas } from '../features/device-canvas/DeviceCanvas';
import { Inspector } from '../features/inspector/Inspector';
import { useApp, useActiveDevice } from '../state/store';
import './Editor.css';

export function EditorRoute() {
  const device = useActiveDevice();
  const profile = useApp((s) => s.profile);
  const setRoute = useApp((s) => s.setRoute);
  const setActiveLayer = useApp((s) => s.setActiveLayer);
  const [overview, setOverview] = useState(true);

  if (!device) {
    return (
      <div className="editor__empty">
        <h2>Sem controlador selecionado</h2>
        <p>Crie ou conecte um controlador na aba Controladores.</p>
        <Button variant="primary" onClick={() => setRoute('devices')}>Ir pra Controladores</Button>
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor__main">
        <div className="editor__layers">
          <div className="editor__layers-head">
            <Badge tone="accent" icon={<Layers />}>Layers</Badge>
            <Button size="sm" variant="ghost" icon={overview ? <EyeOff size={12} /> : <Eye size={12} />} onClick={() => setOverview(!overview)}>
              {overview ? 'Esconder mapeados' : 'Mostrar mapeados'}
            </Button>
          </div>
          <div className="editor__layers-row">
            {profile?.layers.map((layer) => {
              const active = profile.active_layer === layer.id;
              const count = profile.mappings.filter((m) => m.layer === layer.id).length;
              return (
                <button
                  key={layer.id}
                  type="button"
                  className={`editor__layer ${active ? 'editor__layer--active' : ''}`}
                  onClick={() => setActiveLayer(layer.id)}
                  style={{ borderColor: active ? layer.color || 'var(--accent)' : 'var(--border)' }}
                >
                  <span className="editor__layer-dot" style={{ background: layer.color || 'var(--accent)' }} />
                  <span className="editor__layer-name">{layer.name}</span>
                  <span className="editor__layer-count">{count}</span>
                </button>
              );
            })}
            <Button variant="ghost" size="sm" icon={<Plus size={12} />}>Nova layer</Button>
          </div>
        </div>
        <DeviceCanvas />
      </div>
      <Inspector />
    </div>
  );
}
