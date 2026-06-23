import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { makeStyles } from '@/theme';
import { Appear } from './fade-in';
import { Button } from './button';
import { Text } from './text';

export type AppDialogAction = {
  label: string;
  variant?: 'default' | 'danger' | 'cancel';
  onPress?: () => void;
};

type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  actions: AppDialogAction[];
  onClose: () => void;
};

const mapVariant = (variant: AppDialogAction['variant']) => {
  if (variant === 'danger') return 'danger' as const;
  if (variant === 'cancel') return 'secondary' as const;
  return 'primary' as const;
};

export function AppDialog({ visible, title, message, actions, onClose }: AppDialogProps) {
  const styles = useStyles();

  const handleActionPress = (action: AppDialogAction) => {
    onClose();
    action.onPress?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.containerWrap}>
          <Appear style={styles.container}>
            <Text variant="subheading">{title}</Text>
            {message ? (
              <Text variant="body" color="textSecondary" style={styles.message}>
                {message}
              </Text>
            ) : null}

            <View style={styles.actions}>
              {actions.map((action, index) => (
                <Button
                  key={`${action.label}-${index}`}
                  label={action.label}
                  variant={mapVariant(action.variant)}
                  onPress={() => handleActionPress(action)}
                  fullWidth
                  haptic={action.variant === 'danger'}
                />
              ))}
            </View>
          </Appear>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  overlay: {
    flex: 1,
    backgroundColor: t.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.xl,
  },
  containerWrap: {
    width: '100%',
    maxWidth: 420,
  },
  container: {
    backgroundColor: t.colors.surfaceElevated,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing['2xl'],
    ...t.shadow.lg,
  },
  message: {
    marginTop: t.spacing.sm,
  },
  actions: {
    marginTop: t.spacing.xl,
    gap: t.spacing.sm,
  },
}));
