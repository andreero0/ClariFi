import { View, Text, StyleSheet, Button, TextInput } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';

export default function AddCardModal() {
  const router = useRouter();
  const [cardName, setCardName] = useState('');
  const [limit, setLimit] = useState('');

  const handleAddCard = () => {
    console.log('Adding card:', cardName, limit);
    // TODO: Add card logic
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Credit Card</Text>
      <TextInput
        style={styles.input}
        placeholder="Card Nickname (e.g., RBC Avion)"
        value={cardName}
        onChangeText={setCardName}
      />
      <TextInput
        style={styles.input}
        placeholder="Credit Limit"
        value={limit}
        onChangeText={setLimit}
        keyboardType="numeric"
      />
      {/* Add other fields like statement_day, payment_due_days, apr as per spec */}
      <View style={styles.buttonContainer}>
        <Button title="Add Card" onPress={handleAddCard} />
      </View>
      <Button title="Cancel" onPress={() => router.back()} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    height: 50,
    borderColor: 'lightgray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  buttonContainer: {
    width: '90%',
    marginVertical: 10,
  },
});
