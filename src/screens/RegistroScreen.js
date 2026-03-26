import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../config/firebase'; 
import { doc, setDoc } from "firebase/firestore"; 

export default function RegistroScreen({ navigation }) {
  // Estados para datos personales
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [baseTaxi, setBaseTaxi] = useState('');
  const [licencia, setLicencia] = useState('');
  // Estados para datos del vehículo
  const [placas, setPlacas] = useState('');
  const [modelo, setModelo] = useState('');
  const [curp, setCurp] = useState('');
  const [cargando, setCargando] = useState(false);

  const finalizarRegistro = async () => {
    // Validación de seguridad
    if (!nombre.trim() || !placas.trim() || !baseTaxi.trim()) {
      Alert.alert("Campos faltantes", "Nombre, Base y Placas son obligatorios.");
      return;
    }

    setCargando(true);

    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : "TEST_USER_" + Date.now(); 

      // Guardamos TODO en la colección "conductores"
      await setDoc(doc(db, "conductores", userId), {
        nombre: nombre,
        apellidos: apellidos,
        baseTaxi: baseTaxi,
        licencia: licencia,
        placas: placas.toUpperCase(),
        modelo: modelo,
        curp: curp.toUpperCase(),
        fechaRegistro: new Date().toISOString(),
        estado: "activo",
        alertaActiva: false // Para el dashboard administrativo
      });

      Alert.alert("¡Éxito!", "Unidad y conductor registrados correctamente.");
      navigation.navigate('Mapa'); 

    } catch (error) {
      Alert.alert("Error de Firebase", error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>REGISTRO TAXITAB</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>NOMBRE(S):</Text>
        <TextInput style={styles.input} placeholder="Juan" onChangeText={setNombre} value={nombre} />

        <Text style={styles.label}>APELLIDO(S):</Text>
        <TextInput style={styles.input} placeholder="Pérez" onChangeText={setApellidos} value={apellidos} />

        <Text style={styles.label}>BASE DE TAXI:</Text>
        <TextInput style={styles.input} placeholder="Ej. Almoloya" onChangeText={setBaseTaxi} value={baseTaxi} />

        <Text style={styles.label}>LICENCIA:</Text>
        <TextInput style={styles.input} placeholder="No. de Licencia" onChangeText={setLicencia} value={licencia} />

        <View style={styles.linea} />

        <Text style={styles.label}>No. DE PLACAS:</Text>
        <TextInput style={styles.input} placeholder="AHT5E" autoCapitalize="characters" onChangeText={setPlacas} value={placas} />

        <Text style={styles.label}>MODELO DE VEHÍCULO:</Text>
        <TextInput style={styles.input} placeholder="Nissan Tsuru" onChangeText={setModelo} value={modelo} />
        
        <Text style={styles.label}>CURP:</Text>
        <TextInput style={styles.input} placeholder="Tu CURP" autoCapitalize="characters" onChangeText={setCurp} value={curp} />
      </View>

      <TouchableOpacity style={styles.button} onPress={finalizarRegistro} disabled={cargando}>
        {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>FINALIZAR</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  form: { marginBottom: 10 },
  label: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 15, color: '#000' },
  linea: { height: 1, backgroundColor: '#444', marginVertical: 15 },
  button: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 30, marginBottom: 50 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});