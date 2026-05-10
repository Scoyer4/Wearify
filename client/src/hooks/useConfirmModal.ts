import { useState } from 'react';
import { createElement } from 'react';
import ConfirmModal, { ConfirmModalProps } from '../components/ConfirmModal/ConfirmModal';

type ConfirmConfig = Omit<ConfirmModalProps, 'isOpen' | 'onConfirm' | 'onCancel'>;

interface ActiveConfig extends ConfirmConfig {
  onConfirm: () => void;
  onCancel: () => void;
}

export function useConfirmModal() {
  const [config, setConfig] = useState<ActiveConfig | null>(null);

  const confirm = (cfg: ConfirmConfig): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...cfg,
        onConfirm: () => { setConfig(null); resolve(true); },
        onCancel:  () => { setConfig(null); resolve(false); },
      });
    });
  };

  const ModalComponent = config
    ? createElement(ConfirmModal, { ...config, isOpen: true })
    : null;

  return { confirm, ModalComponent };
}
