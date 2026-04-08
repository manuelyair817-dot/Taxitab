import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, SafeAreaView, Alert } from 'react-native';

export default function LoginWithEmailScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 1. Verificamos que los campos no estén vacíos
    if(email && password) {
      
      // 2. Filtro de Administrador: 
      // Si el correo es el del jefe, lo mandamos a la nueva pantalla Admin
      if (email.toLowerCase() === 'admin@taxitab.com') {
        navigation.navigate('Admin'); 
      } 
      // 3. Si es cualquier otro correo, sigue funcionando como antes para los choferes
      else {
        navigation.navigate('Mapa'); 
      }

    } else {
      // Usamos Alert en lugar de alert para que se vea mejor en Android
      Alert.alert("Campos vacíos", "Por favor llena todos los campos para ingresar.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>INICIAR SESIÓN</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>CORREO ELECTRÓNICO:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="ejemplo@correo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>CONTRASEÑA:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>INGRESAR</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 25, justifyContent: 'center' },
  header: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  form: { marginBottom: 30 },
  label: { color: '#ccc', marginBottom: 8, fontSize: 14, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20 },
  button: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 35, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});