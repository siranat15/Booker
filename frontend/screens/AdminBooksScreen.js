import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import axiosClient from '../api/axiosClient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const AdminBooksScreen = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Edit modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editAuthor, setEditAuthor] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchBooks = async () => {
        try {
            const response = await axiosClient.get('/books');
            setBooks(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBooks();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBooks();
    };

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const confirmAction = (title, message, onConfirm) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${title}\n${message}`)) {
                onConfirm();
            }
        } else {
            Alert.alert(title, message, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: onConfirm }
            ]);
        }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        setEditTitle(book.title);
        setEditAuthor(book.author);
        setEditQuantity(book.quantity.toString());
        setModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editTitle || !editAuthor || !editQuantity) {
            showAlert('Error', 'Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            await axiosClient.put(`/books/${editingBook._id}`, {
                title: editTitle,
                author: editAuthor,
                quantity: parseInt(editQuantity)
            });
            setModalVisible(false);
            showAlert('Success', 'Book updated successfully');
            fetchBooks();
        } catch (error) {
            console.error(error);
            showAlert('Error', error.response?.data?.error || 'Failed to update book');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (book) => {
        confirmAction(
            'Delete Book',
            `Are you sure you want to delete "${book.title}"?`,
            async () => {
                try {
                    await axiosClient.delete(`/books/${book._id}`);
                    showAlert('Success', 'Book deleted successfully');
                    fetchBooks();
                } catch (error) {
                    console.error(error);
                    showAlert('Error', error.response?.data?.error || 'Failed to delete book');
                }
            }
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.bookInfo}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>by {item.author}</Text>
                <View style={styles.statusContainer}>
                    <View style={[styles.badge, item.quantity > 0 ? styles.badgeAvailable : styles.badgeOut]}>
                        <Text style={styles.badgeText}>
                            {item.quantity > 0 ? 'Available' : 'Out of Stock'}
                        </Text>
                    </View>
                    <Text style={styles.quantity}>Qty: {item.quantity}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                    <Ionicons name="pencil" size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash" size={18} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>All Books</Text>
                <Text style={styles.subtext}>Manage library inventory</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={books}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No books in the library.</Text>
                        </View>
                    }
                />
            )}

            {/* Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Book</Text>

                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Book title"
                        />

                        <Text style={styles.label}>Author</Text>
                        <TextInput
                            style={styles.input}
                            value={editAuthor}
                            onChangeText={setEditAuthor}
                            placeholder="Author name"
                        />

                        <Text style={styles.label}>Quantity</Text>
                        <TextInput
                            style={styles.input}
                            value={editQuantity}
                            onChangeText={setEditQuantity}
                            placeholder="Quantity"
                            keyboardType="numeric"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5ea',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    subtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    bookInfo: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    author: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    badgeAvailable: {
        backgroundColor: '#E8F5E9',
    },
    badgeOut: {
        backgroundColor: '#FFEBEE',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    quantity: {
        fontSize: 12,
        color: '#888',
    },
    actions: {
        flexDirection: 'row',
    },
    editButton: {
        padding: 10,
        marginRight: 4,
    },
    deleteButton: {
        padding: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 6,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 14,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        marginLeft: 8,
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default AdminBooksScreen;
