import * as RadixTabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import './Tabs.css';

export type Tab = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
};

export function Tabs({
  value,
  onChange,
  tabs,
  children,
  variant = 'pill',
}: {
  value: string;
  onChange: (value: string) => void;
  tabs: Tab[];
  children: ReactNode;
  variant?: 'pill' | 'underline';
}) {
  return (
    <RadixTabs.Root value={value} onValueChange={onChange} className="ui-tabs">
      <RadixTabs.List className={clsx('ui-tabs__list', `ui-tabs__list--${variant}`)}>
        {tabs.map((tab) => (
          <RadixTabs.Trigger key={tab.value} value={tab.value} className="ui-tabs__trigger" asChild>
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 700, damping: 30 }}
            >
              {tab.icon ? <span className="ui-tabs__icon">{tab.icon}</span> : null}
              <span>{tab.label}</span>
              {tab.badge ? <span className="ui-tabs__badge">{tab.badge}</span> : null}
              {variant === 'underline' && value === tab.value ? (
                <motion.span layoutId="ui-tabs-underline" className="ui-tabs__underline" />
              ) : null}
              {variant === 'pill' && value === tab.value ? (
                <motion.span layoutId="ui-tabs-pill" className="ui-tabs__pill" />
              ) : null}
            </motion.button>
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RadixTabs.Content value={value} className="ui-tabs__panel">
      {children}
    </RadixTabs.Content>
  );
}
