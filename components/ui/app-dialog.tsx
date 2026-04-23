import React from 'react';
import { Modal, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

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

export function AppDialog({ visible, title, message, actions, onClose }: AppDialogProps) {
  const handleActionPress = (action: AppDialogAction) => {
    onClose();
    action.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actionsContainer}>
            {actions.map((action, index) => {
              const variant = action.variant ?? 'default';
              const buttonStyles: StyleProp<ViewStyle> = [styles.actionButton];
              const textStyles: StyleProp<TextStyle> = [styles.actionText];

              if (variant === 'danger') {
                buttonStyles.push(styles.dangerButton);
                textStyles.push(styles.dangerText);
              }

              if (variant === 'cancel') {
                buttonStyles.push(styles.cancelButton);
                textStyles.push(styles.cancelText);
              }

              return (
                <TouchableOpacity
                  key={`${action.label}-${index}`}
                  style={buttonStyles}
                  activeOpacity={0.8}
                  onPress={() => handleActionPress(action)}
                >
                  <Text style={textStyles}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    color: '#64748b',
    lineHeight: 21,
  },
  actionsContainer: {
    marginTop: 18,
    gap: 10,
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerText: {
    color: '#fecaca',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  cancelText: {
    color: '#0f172a',
  },
});
