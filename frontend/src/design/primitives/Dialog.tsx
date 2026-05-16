import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import './Dialog.css';

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild>
              <motion.div
                className="ui-dialog__overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content asChild>
              <div className="ui-dialog__viewport">
                <motion.div
                  className={`ui-dialog ui-dialog--${size}`}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 4 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {title || description ? (
                    <header className="ui-dialog__head">
                      <div>
                        {title ? (
                          <RadixDialog.Title className="ui-dialog__title">
                            {title}
                          </RadixDialog.Title>
                        ) : null}
                        {description ? (
                          <RadixDialog.Description className="ui-dialog__desc">
                            {description}
                          </RadixDialog.Description>
                        ) : null}
                      </div>
                      <RadixDialog.Close className="ui-dialog__close" aria-label="Fechar">
                        <X size={16} />
                      </RadixDialog.Close>
                    </header>
                  ) : null}
                  <div className="ui-dialog__body">{children}</div>
                </motion.div>
              </div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
