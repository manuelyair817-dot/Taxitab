import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors'; // <--- Agregamos Gyroscope

// --- IMPORTACIONES DE FIREBASE ---
import { db, auth } from '../config/firebase'; 
import { doc, updateDoc } from "firebase/firestore";

export default function MapaScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  
  // Estados para los sensores
  const [accelSubscription, setAccelSubscription] = useState(null);
  const [gyroSubscription, setGyroSubscription] = useState(null);
  
  const mapRef = useRef(null);

  // --- 1. LÓGICA DEL GPS Y SINCRONIZACIÓN CON LA NUBE ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos de ubicación.');
        setLoading(false);
        return;
      }

      let currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(currentLoc);
      setLoading(false);

      // Rastreador en tiempo real
      await Location.watchPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, 
        distanceInterval: 2, 
      }, async (newLoc) => {
        const { latitude, longitude } = newLoc.coords;
        setLocation(newLoc);

        // Mover cámara del mapa suavemente
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);

        // ACTUALIZAR FIREBASE
        try {
          const user = auth.currentUser;
          if (user) {
            const conductorRef = doc(db, "conductores", user.uid);
            await updateDoc(conductorRef, {
              ubicacion: { latitude, longitude },
              ultimaConexion: new Date().toISOString()
            });
            console.log("📍 GPS Sincronizado");
          }
        } catch (error) {
          console.log("Error Firebase:", error.message);
        }
      });
    })();
  }, []);

  // --- 2. LÓGICA DE SENSORES (ACELERÓMETRO Y GIROSCOPIO) ---
  useEffect(() => {
    // Activar Acelerómetro (Impactos)
    const subAccel = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      if (acceleration > 3.8) setAlertVisible(true); // Umbral de impacto
    });
    Accelerometer.setUpdateInterval(100);
    setAccelSubscription(subAccel);

    // Activar Giroscopio (Vueltas Bruscas)
    const subGyro = Gyroscope.addListener(data => {
      const { z } = data;
      if (Math.abs(z) > 4.5) { // Si gira muy rápido sobre su propio eje
        console.log("🔄 Giro brusco detectado");
      }
    });
    Gyroscope.setUpdateInterval(100);
    setGyroSubscription(subGyro);

    // Limpieza al salir de la pantalla
    return () => {
      subAccel && subAccel.remove();
      subGyro && subGyro.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Iniciando Taxitab...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || 19.4326, 
          longitude: location?.coords.longitude || -99.1332,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Tu Unidad"
          >
            <View style={styles.taxiContainer}>
               <Text style={{fontSize: 35}}>🚕</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* MODAL DE ALERTA */}
      <Modal animationType="fade" transparent={true} visible={alertVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.warningIcon}>
               <Text style={{fontSize: 30}}>⚠️</Text>
            </View>
            <Text style={styles.alertTitle}>¡ALERTA DE SEGURIDAD!</Text>
            <Text style={styles.alertSubtitle}>Se detectó un movimiento inusual</Text>
            
            <TouchableOpacity 
              style={styles.panicButton}
              onPress={() => {
                Alert.alert("AUXILIO ENVIADO", "Tu ubicación ha sido enviada a la base central de Taxitab.");
                setAlertVisible(false);
              }}
            >
              <Text style={styles.panicText}>SOLICITAR AYUDA</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setAlertVisible(false)}>
              <Text style={styles.cancelText}>ESTOY BIEN, CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 10 },
  taxiContainer: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 5, borderRadius: 50, borderWidth: 1, borderColor: '#ffd700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: '85%', backgroundColor: '#1a1a1a', borderRadius: 25, padding: 25, alignItems: 'center', borderWidth: 2, borderColor: '#ff0000' },
  warningIcon: { marginBottom: 10 },
  alertTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  alertSubtitle: { color: '#bbb', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  panicButton: { backgroundColor: '#ff0000', width: '100%', padding: 15, borderRadius: 25, alignItems: 'center', marginBottom: 15 },
  panicText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelText: { color: '#888', textDecorationLine: 'underline' },
});