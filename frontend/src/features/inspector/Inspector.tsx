import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Tag, Layers, MousePointer, Clock, Zap, Code2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge, Button, Tabs, TabPanel, type Tab, Card } from '../../design';
import { useApp, useSelectedControl } from '../../state/store';
import { backend } from '../../lib/backend';
import type { Mapping, TriggerMode } from '../../types/models';
import { ActionBrowser } from '../action-browser/ActionBrowser';
import { TriggerSelector } from './TriggerSelector';
import { ActionParamsForm } from './ActionParamsForm';
import './Inspector.css';

const TABS: Tab[] = [
  { value: 'basic', label: 'Básico', icon: <Zap size={12} /> },
  { value: 'advanced', label: 'Avançado', icon: <Clock size={12} /> },
  { value: 'expert', label: 'Expert', icon: <Code2 size={12} /> },
];

export function Inspector() {
  const control = useSelectedControl();
  const profile = useApp((s) => s.profile);
  const actions = useApp((s) => s.actions);
  const [tab, setTab] = useState('basic');
  const [browserOpen, setBrowserOpen] = useState(false);
  const [activeMappingId, setActiveMappingId] = useState<TriggerMode | null>(null);

  const mappingsByTrigger = useMemo(() => {
    if (!control || !profile) return {} as Partial<Record<TriggerMode, Mapping>>;
    const out: Partial<Record<TriggerMode, Mapping>> = {};
    for (const mapping of profile.mappings) {
      if (mapping.control_id !== control.id) continue;
      if (mapping.layer && mapping.layer !== profile.active_layer) continue;
      out[mapping.trigger] = mapping;
    }
    return out;
  }, [control, profile]);

  if (!control) {
    return (
      <aside className="inspector inspector--empty">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <span className="inspector__empty-icon">
            <MousePointer size={22} />
          </span>
          <h3>Selecione um controle</h3>
          <p>Clique num <strong>pad</strong>, <strong>knob</strong>, <strong>tecla</strong> ou <strong>botão</strong> no canvas pra criar ou editar o atalho.</p>
          <ul className="inspector__empty-tips">
            <li><strong>Verde</strong> no canto = já tem atalho</li>
            <li><strong>Borda ciano</strong> = controle selecionado</li>
            <li>Use os 4 disparos (press / hold / double / release) pra <strong>multiplicar</strong> ações por controle</li>
          </ul>
        </motion.div>
      </aside>
    );
  }

  const mapping = activeMappingId ? mappingsByTrigger[activeMappingId] : mappingsByTrigger.press;
  const activeDef = mapping ? actions.find((a) => a.id === mapping.action.id) : undefined;

  return (
    <>
      <aside className="inspector">
        <header className="inspector__head">
          <div className="inspector__title">
            <Badge tone="accent" size="sm">{control.kind}</Badge>
            <h2>{control.name}</h2>
          </div>
          <div className="inspector__meta">
            <code>{control.signature ?? '—'}</code>
            <span>{control.group}</span>
          </div>
        </header>

        <TriggerSelector
          activeTrigger={(activeMappingId ?? 'press') as TriggerMode}
          onChange={setActiveMappingId}
          mappings={mappingsByTrigger}
        />

        {mapping ? (
          <>
            <Card variant="surface" padding="sm" className="inspector__action-summary">
              <motion.div
                key={mapping.action.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="inspector__action-summary-inner"
              >
                <div>
                  <span className="inspector__action-cat">
                    {activeDef?.category ?? '—'}
                  </span>
                  <strong>{activeDef?.label ?? mapping.action.id}</strong>
                  {activeDef?.description ? (
                    <p>{activeDef.description}</p>
                  ) : null}
                </div>
                <Button variant="subtle" size="sm" onClick={() => setBrowserOpen(true)}>
                  Trocar ação
                </Button>
              </motion.div>
            </Card>

            <Tabs value={tab} onChange={setTab} tabs={TABS} variant="underline">
              <TabPanel value="basic">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`basic-${mapping.action.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ActionParamsForm mapping={mapping} definition={activeDef} mode="basic" />
                  </motion.div>
                </AnimatePresence>
              </TabPanel>
              <TabPanel value="advanced">
                <AdvancedPanel mapping={mapping} />
              </TabPanel>
              <TabPanel value="expert">
                <ExpertPanel mapping={mapping} />
              </TabPanel>
            </Tabs>

            <footer className="inspector__footer">
              <Button variant="ghost" icon={<Trash2 size={14} />}>Remover atalho</Button>
              <TestFireButton mapping={mapping} />
            </footer>
          </>
        ) : (
          <motion.div
            className="inspector__empty-action"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>Sem ação configurada pra este disparo</h3>
            <p>Escolha uma ação do catálogo ou arraste uma recipe pronta.</p>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setBrowserOpen(true)}>
              Adicionar ação
            </Button>
          </motion.div>
        )}
      </aside>

      <ActionBrowser open={browserOpen} onClose={() => setBrowserOpen(false)} />
    </>
  );
}

function TestFireButton({ mapping }: { mapping: Mapping }) {
  const [state, setState] = useState<'idle' | 'firing' | 'ok' | 'error'>('idle');
  const fire = async () => {
    setState('firing');
    try {
      const result = await backend.testAction(mapping.action.id, mapping.action.params);
      setState(result.ran ? 'ok' : 'error');
    } catch {
      setState('error');
    } finally {
      window.setTimeout(() => setState('idle'), 1400);
    }
  };
  return (
    <Button
      variant="primary"
      icon={state === 'ok' ? <CheckCircle2 size={14} /> : state === 'error' ? <AlertCircle size={14} /> : <Zap size={14} />}
      onClick={() => void fire()}
      loading={state === 'firing'}
    >
      {state === 'ok' ? 'Disparou!' : state === 'error' ? 'Falhou' : 'Testar agora'}
    </Button>
  );
}

function AdvancedPanel({ mapping }: { mapping: Mapping }) {
  return (
    <div className="inspector__advanced">
      <Card variant="surface" padding="sm">
        <header className="inspector__row-head">
          <Layers size={14} />
          <strong>Layer</strong>
        </header>
        <p>Esta ação roda apenas na layer <code>{mapping.layer}</code>.</p>
      </Card>
      <Card variant="surface" padding="sm">
        <header className="inspector__row-head">
          <Clock size={14} />
          <strong>Condição</strong>
        </header>
        <p>
          {mapping.condition.type === 'always'
            ? 'Sempre dispara.'
            : `Dispara quando ${mapping.condition.type} = ${JSON.stringify(mapping.condition.params)}.`}
        </p>
      </Card>
      <Card variant="surface" padding="sm">
        <header className="inspector__row-head">
          <Tag size={14} />
          <strong>Tags</strong>
        </header>
        <div className="inspector__tags">
          {mapping.tags.length === 0 ? (
            <span className="inspector__muted">Sem tags. Use pra agrupar mapeamentos por app/perfil.</span>
          ) : (
            mapping.tags.map((tag) => <Badge key={tag} tone="neutral" size="sm">{tag}</Badge>)
          )}
        </div>
      </Card>
    </div>
  );
}

function ExpertPanel({ mapping }: { mapping: Mapping }) {
  return (
    <div className="inspector__expert">
      <p className="inspector__muted">Parâmetros crus em JSON. Edite com cuidado.</p>
      <pre className="inspector__json">
        <code>{JSON.stringify(mapping, null, 2)}</code>
      </pre>
    </div>
  );
}
