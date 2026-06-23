import { useCallback, useMemo, useState } from 'react';
import { AppDialogAction } from '@/components/ui';

type DialogState = {
  visible: boolean;
  title: string;
  message?: string;
  actions: AppDialogAction[];
};

const INITIAL: DialogState = { visible: false, title: '', message: undefined, actions: [] };

/**
 * Centralizes the themed AppDialog state that every library screen used to
 * re-implement. Returns props to spread onto <AppDialog /> plus helpers.
 */
export function useAppDialog() {
  const [state, setState] = useState<DialogState>(INITIAL);

  const close = useCallback(() => setState((s) => ({ ...s, visible: false })), []);

  const show = useCallback(
    (config: { title: string; message?: string; actions: AppDialogAction[] }) => {
      setState({ visible: true, ...config });
    },
    []
  );

  /** Convenience for a destructive confirm flow. */
  const confirm = useCallback(
    (config: {
      title: string;
      message?: string;
      confirmLabel?: string;
      onConfirm: () => void;
      destructive?: boolean;
    }) => {
      show({
        title: config.title,
        message: config.message,
        actions: [
          { label: 'Cancel', variant: 'cancel' },
          {
            label: config.confirmLabel ?? 'Confirm',
            variant: config.destructive ? 'danger' : 'default',
            onPress: config.onConfirm,
          },
        ],
      });
    },
    [show]
  );

  /** Convenience for a single-button alert. */
  const alert = useCallback(
    (title: string, message?: string) => {
      show({ title, message, actions: [{ label: 'OK', variant: 'cancel' }] });
    },
    [show]
  );

  const props = useMemo(
    () => ({
      visible: state.visible,
      title: state.title,
      message: state.message,
      actions: state.actions,
      onClose: close,
    }),
    [state, close]
  );

  return { props, show, confirm, alert, close };
}
