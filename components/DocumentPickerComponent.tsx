import React from 'react';
import { StyleSheet, Pressable, View as RNView, Alert, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';

interface DocumentPickerComponentProps {
  documents: { uri: string, mimeType: string }[];
  setDocuments: React.Dispatch<React.SetStateAction<{ uri: string, mimeType: string }[]>>;
  loading: boolean;
  tintColor: string;
  isDark: boolean;
}

export default function DocumentPickerComponent({
  documents,
  setDocuments,
  loading,
  tintColor,
  isDark,
}: DocumentPickerComponentProps) {
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all document types
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newDocumentUri = result.assets[0].uri;
        const newDocumentMimeType = result.assets[0].mimeType || 'application/octet-stream'; // Default mimeType
        setDocuments(prevDocs => [...prevDocs, { uri: newDocumentUri, mimeType: newDocumentMimeType }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prevDocs => prevDocs.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>
        Supporting Documents
      </Text>
      <View style={styles.documentList}>
        {documents.map((doc, index) => (
          <RNView key={index} style={[styles.documentTile, isDark && styles.darkDocumentTile]}>
            <Ionicons name="document-text-outline" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
            <Text style={[styles.documentName, isDark && styles.darkDocumentName]} numberOfLines={1}>
              {doc.uri.split('/').pop()}
            </Text>
            <Pressable onPress={() => handleRemoveDocument(index)} style={styles.removeDocumentButton}>
              <Ionicons name="close-circle" size={20} color="red" />
            </Pressable>
          </RNView>
        ))}
        <Pressable
          onPress={handlePickDocument}
          style={({ pressed }) => [
            styles.addDocumentButton,
            { opacity: pressed ? 0.7 : 1 },
            isDark && styles.darkAddDocumentButton,
          ]}
          disabled={loading}
        >
          <FontAwesome name="plus" size={20} color={isDark ? Colors.dark.text : Colors.light.text} />
          <Text style={[styles.addDocumentButtonText, isDark && styles.darkAddDocumentButtonText]}>
            Add Document
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    marginBottom: 8,
    color: Colors.light.text,
    fontWeight: '600',
  },
  darkLabel: {
    color: Colors.dark.text,
  },
  documentList: {
    marginTop: 8,
  },
  documentTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  darkDocumentTile: {
    backgroundColor: Colors.dark.cardBackground,
  },
  documentName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  darkDocumentName: {
    color: Colors.dark.text,
  },
  removeDocumentButton: {
    marginLeft: 10,
    padding: 4,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  darkAddDocumentButton: {
    backgroundColor: Colors.dark.inputBackground,
    borderColor: Colors.dark.border,
  },
  addDocumentButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  darkAddDocumentButtonText: {
    color: Colors.dark.text,
  },
});
