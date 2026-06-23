import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { makeStyles } from '@/theme';
import { Appear } from './fade-in';
import { Button } from './button';
import { Text } from './text';

export type FormModalProps = {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  primaryLoading?: boolean;
};

/** Reusable add/edit dialog with a springy entrance — shared by all library editors. */
export function FormModal({
  visible,
  title,
  children,
  primaryLabel,
  onPrimary,
  onCancel,
  cancelLabel = 'Cancel',
  primaryLoading,
}: FormModalProps) {
  const styles = useStyles();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={onCancel}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetWrap}>
            <Appear translateFrom={16} style={styles.sheet}>
              <Text variant="heading" style={styles.title}>
                {title}
              </Text>
              {children}
              <View style={styles.actions}>
                <Button label={cancelLabel} variant="secondary" onPress={onCancel} style={styles.flexBtn} />
                <Button
                  label={primaryLabel}
                  onPress={onPrimary}
                  loading={primaryLoading}
                  style={styles.flexBtn}
                />
              </View>
            </Appear>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: t.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.spacing.xl,
  },
  sheetWrap: {
    width: '100%',
    maxWidth: 420,
  },
  sheet: {
    backgroundColor: t.colors.surfaceElevated,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing['2xl'],
    ...t.shadow.lg,
  },
  title: {
    marginBottom: t.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: t.spacing.md,
    marginTop: t.spacing.xl,
  },
  flexBtn: {
    flex: 1,
  },
}));
