import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';

export default function RegistroScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>DATOS DEL VEHÍCULO</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>No. DE PLACAS:</Text>
        <TextInput style={styles.input} placeholder="AHT5E" />

        <Text style={styles.label}>MODELO:</Text>
        <TextInput style={styles.input} placeholder="Nissan Tsuru" />
        
        <Text style={styles.label}>CURP:</Text>
        <TextInput style={styles.input} />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Mapa')}
      >
        <Text style={styles.buttonText}>FINALIZAR REGISTRO</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 25 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  form: { marginBottom: 20 },
  label: { color: '#ccc', marginBottom: 5, fontSize: 12 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 18 },
  button: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 30, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }
});