import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';

// --- IMPORTACIONES DE FIREBASE ---
import { db, auth } from '../config/firebase'; 
import { doc, updateDoc } from "firebase/firestore";

export default function MapaScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [subscription, setSubscription] = useState(null);
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

        // Mover cámara del mapa
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

  // --- 2. LÓGICA DEL ACELERÓMETRO ---
  useEffect(() => {
    const _subscribe = () => {
      setSubscription(
        Accelerometer.addListener(data => {
          const { x, y, z } = data;
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          if (acceleration > 3.5) setAlertVisible(true);
        })
      );
      Accelerometer.setUpdateInterval(100);
    };
    _subscribe();
    return () => subscription && subscription.remove();
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
            <Text style={styles.alertTitle}>¡ALERTA DE IMPACTO!</Text>
            <TouchableOpacity 
              style={styles.panicButton}
              onPress={() => {
                Alert.alert("AUXILIO", "Se envió tu ubicación a la base.");
                setAlertVisible(false);
              }}
            >
              <Text style={styles.panicText}>SOLICITAR AYUDA</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAlertVisible(false)}>
              <Text style={styles.cancelText}>ESTOY BIEN</Text>
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
  alertBox: { width: '80%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 25, alignItems: 'center', borderWeight: 2, borderColor: '#f00' },
  alertTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  panicButton: { backgroundColor: '#ff0000', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  panicText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { color: '#888', textDecorationLine: 'underline' },
});