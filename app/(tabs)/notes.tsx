import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import {
  AppDialog,
  Card,
  EmptyState,
  FadeIn,
  FormModal,
  IconButton,
  Screen,
  Text,
  TextField,
  stagger,
} from '@/components/ui';
import { useAppDialog } from '@/hooks/use-app-dialog';
import { makeStyles } from '@/theme';
import { generateId } from '../utils/helpers';
import { loadNotes, saveNotes } from '../utils/storage';

type QuickNote = {
  id: string;
  text: string;
  createdAt: string;
};

export default function NotesScreen() {
  const styles = useStyles();
  const dialog = useAppDialog();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalText, setModalText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => setNotes(await loadNotes()))();
    }, [])
  );

  const handleSaveNote = async () => {
    if (!modalText.trim()) {
      dialog.alert('Empty Note', 'Please enter some text for your note.');
      return;
    }
    let updatedNotes: QuickNote[];
    if (editingNoteId) {
      updatedNotes = notes.map((n) => (n.id === editingNoteId ? { ...n, text: modalText.trim() } : n));
    } else {
      const newNote: QuickNote = { id: generateId(), text: modalText.trim(), createdAt: new Date().toISOString() };
      updatedNotes = [newNote, ...notes];
    }
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
    closeModal();
  };

  const openEditModal = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setModalText(note.text);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalText('');
    setEditingNoteId(null);
    setIsModalOpen(false);
  };

  const handleNoteLongPress = (noteId: string) => {
    dialog.show({
      title: 'Note Options',
      message: 'What would you like to do?',
      actions: [
        { label: 'Edit', onPress: () => openEditModal(noteId) },
        {
          label: 'Delete',
          variant: 'danger',
          onPress: async () => {
            const updatedNotes = notes.filter((n) => n.id !== noteId);
            setNotes(updatedNotes);
            await saveNotes(updatedNotes);
          },
        },
        { label: 'Cancel', variant: 'cancel' },
      ],
    });
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <Screen edgeBottom style={styles.container}>
      <View style={styles.header}>
        <Text variant="title">Notes</Text>
        <IconButton icon="add" onPress={() => { setEditingNoteId(null); setModalText(''); setIsModalOpen(true); }} accessibilityLabel="Add note" />
      </View>

      {notes.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No notes yet" description="Tap + to capture a quick thought." />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeIn delay={stagger(Math.min(index, 8))}>
              <Card onPress={() => openEditModal(item.id)} onLongPress={() => handleNoteLongPress(item.id)} style={styles.noteCard}>
                <View style={styles.noteRow}>
                  <View style={styles.bullet} />
                  <View style={styles.flex}>
                    <Text variant="body" numberOfLines={4}>{item.text}</Text>
                    <Text variant="caption" color="textMuted" style={styles.timestamp}>
                      {getRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </Card>
            </FadeIn>
          )}
        />
      )}

      <FormModal
        visible={isModalOpen}
        title={editingNoteId ? 'Edit Note' : 'New Note'}
        primaryLabel={editingNoteId ? 'Update' : 'Save'}
        onPrimary={handleSaveNote}
        onCancel={closeModal}
      >
        <TextField
          placeholder="What do you want to remember?"
          multiline
          maxLength={500}
          value={modalText}
          onChangeText={setModalText}
          autoFocus
        />
      </FormModal>

      <AppDialog {...dialog.props} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    paddingHorizontal: t.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: t.spacing['2xl'],
    paddingBottom: t.spacing.lg,
  },
  list: {
    paddingBottom: t.spacing['2xl'],
  },
  flex: { flex: 1 },
  noteCard: {
    marginBottom: t.spacing.md,
  },
  noteRow: {
    flexDirection: 'row',
    gap: t.spacing.md,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.colors.accent,
    marginTop: 7,
  },
  timestamp: {
    marginTop: t.spacing.sm,
  },
}));
