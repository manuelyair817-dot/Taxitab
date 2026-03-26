import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../config/firebase'; 
import { doc, setDoc } from "firebase/firestore"; 

export default function RegistroScreen({ navigation }) {
  const [placas, setPlacas] = useState('');
  const [modelo, setModelo] = useState('');
  const [curp, setCurp] = useState('');
  const [cargando, setCargando] = useState(false);

  const finalizarRegistro = async () => {
    // 1. Validación de campos vacíos
    if (!placas.trim() || !modelo.trim() || !curp.trim()) {
      Alert.alert("Error", "Por favor, llena todos los campos.");
      return;
    }

    setCargando(true);

    try {
      // 2. Obtener el usuario actual
      const user = auth.currentUser;
      
      // 3. Manejo del error de 'null' (Plan B si no hay login)
      let userId;
      let userEmail;
      let userName;

      if (user) {
        userId = user.uid;
        userEmail = user.email;
        userName = user.displayName || "Conductor Taxitab";
      } else {
        // ID temporal para que puedas probar sin haber hecho login previo
        userId = "ID_PRUEBA_TEMPORAL"; 
        userEmail = "prueba@taxitab.com";
        userName = "Usuario de Prueba";
        console.warn("Advertencia: No hay usuario autenticado. Usando ID de prueba.");
      }

      // 4. Guardar en Firestore
      // Usamos setDoc para crear o sobrescribir el documento del conductor
      await setDoc(doc(db, "conductores", userId), {
        nombre: userName,
        correo: userEmail,
        placas: placas.toUpperCase(),
        modelo: modelo,
        curp: curp.toUpperCase(),
        fechaRegistro: new Date().toISOString(), // Formato estándar de fecha
        estado: "activo"
      });

      Alert.alert("¡Éxito!", "Unidad registrada correctamente en la base de datos.");
      
      // 5. Ir al Mapa
      navigation.navigate('Mapa'); 

    } catch (error) {
      console.error("Error completo:", error);
      Alert.alert("Error al guardar", "No se pudo conectar con la base de datos: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>DATOS DEL VEHÍCULO</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>No. DE PLACAS:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: AHT5E" 
          placeholderTextColor="#999"
          autoCapitalize="characters" // Pone mayúsculas automáticas
          onChangeText={setPlacas}
          value={placas}
        />

        <Text style={styles.label}>MODELO:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nissan Tsuru" 
          placeholderTextColor="#999"
          onChangeText={setModelo}
          value={modelo}
        />
        
        <Text style={styles.label}>CURP:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu CURP"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          onChangeText={setCurp}
          value={curp}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, cargando && { opacity: 0.7 }]} 
        onPress={finalizarRegistro} 
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>FINALIZAR REGISTRO</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 25 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 30, textAlign: 'center', marginTop: 20 },
  form: { marginBottom: 20 },
  label: { color: '#ccc', marginBottom: 5, fontSize: 12 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 18, color: '#000' },
  button: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 30, marginTop: 10, marginBottom: 50 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }
});