import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { generateId } from '../utils/helpers';
import { loadNotes, saveNotes } from '../utils/storage';

type QuickNote = {
  id: string;
  text: string;
  createdAt: string;
};

export default function NotesScreen() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalText, setModalText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadNotesFromStorage = async () => {
        const loadedNotes = await loadNotes();
        setNotes(loadedNotes);
      };
      loadNotesFromStorage();
    }, [])
  );

  const handleAddNote = async () => {
    if (!modalText.trim()) {
      Alert.alert('Empty Note', 'Please enter some text for your note.');
      return;
    }

    if (editingNoteId) {
      // Edit mode: update existing note
      const updatedNotes = notes.map(n =>
        n.id === editingNoteId ? { ...n, text: modalText.trim() } : n
      );
      setNotes(updatedNotes);
      await saveNotes(updatedNotes);
      setEditingNoteId(null);
    } else {
      // Add mode: create new note
      const newNote: QuickNote = {
        id: generateId(),
        text: modalText.trim(),
        createdAt: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      await saveNotes(updatedNotes);
    }

    setModalText('');
    setIsModalOpen(false);
  };

  const handleOpenEditModal = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
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

  const handleNoteAction = (noteId: string) => {
    Alert.alert('Note Options', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit',
        onPress: () => handleOpenEditModal(noteId),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedNotes = notes.filter(n => n.id !== noteId);
          setNotes(updatedNotes);
          await saveNotes(updatedNotes);
        },
      },
    ]);
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const renderNoteItem = ({ item }: { item: QuickNote }) => {
    return (
      <TouchableOpacity
        onPress={() => handleOpenEditModal(item.id)}
        onLongPress={() => handleNoteAction(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.noteItem}>
          <View style={styles.noteContent}>
            <View style={styles.noteHeader}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.noteText} numberOfLines={3}>
                {item.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {getRelativeTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quick Notes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingNoteId(null);
            setModalText('');
            setIsModalOpen(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No notes yet. Tap + to add one!
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.notesList}
        />
      )}

      {/* Add/Edit Note Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingNoteId ? 'Edit Note' : 'New Note'}
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="What do you want to remember?"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={6}
              value={modalText}
              onChangeText={setModalText}
              autoFocus
              maxLength={500}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddNote}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>
                  {editingNoteId ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  notesList: {
    paddingVertical: 8,
  },
  noteItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#3b82f6',
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
