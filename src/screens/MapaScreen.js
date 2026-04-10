import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // ← Cambiado
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { db, auth } from '../config/firebase'; 
import { doc, updateDoc } from "firebase/firestore";

export default function MapaScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const mapRef = useRef(null);

  // --- 1. LÓGICA DE GPS ---
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Permiso de GPS denegado.');
          if (isMounted) setLoading(false);
          return;
        }

        const initial = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced 
        });
        
        if (isMounted) {
          setLocation(initial);
          setLoading(false);
        }

        await Location.watchPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, 
          distanceInterval: 10,
        }, async (newLoc) => {
          if (!isMounted || !newLoc?.coords) return;
          const { latitude, longitude } = newLoc.coords;
          setLocation(newLoc);
          syncFirebase(latitude, longitude, false, "");
        });

      } catch (err) {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // --- Firebase ---
  const syncFirebase = async (lat, lon, alerta, tipoAlerta) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const conductorRef = doc(db, "conductores", user.uid);
        const updates = {
          ubicacion: { latitude: lat, longitude: lon },
          ultimaConexion: new Date().toISOString()
        };
        if (alerta) {
          updates.alertaActiva = true;
          updates.tipoAlerta = tipoAlerta;
          updates.fechaAlerta = updates.ultimaConexion;
        }
        await updateDoc(conductorRef, updates);
      }
    } catch (e) { /* Error silencioso */ }
  };

  // --- 2. SENSORES ---
  useEffect(() => {
    let isMounted = true;

    const subAccel = Accelerometer.addListener(data => {
      if (!isMounted) return;
      const force = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      if (force > 3.8 && !alertVisible) {
        setAlertVisible(true);
        if (location?.coords) {
          syncFirebase(location.coords.latitude, location.coords.longitude, true, "Impacto Detectado");
        }
      }
    });

    const subGyro = Gyroscope.addListener(data => {
      if (!isMounted) return;
      if (Math.abs(data.z) > 4.5 && !alertVisible) { 
        setAlertVisible(true);
        if (location?.coords) {
          syncFirebase(location.coords.latitude, location.coords.longitude, true, "Giro Brusco");
        }
      }
    });

    Accelerometer.setUpdateInterval(300); 
    Gyroscope.setUpdateInterval(300);

    return () => {
      isMounted = false;
      subAccel.remove();
      subGyro.remove();
    };
  }, [location, alertVisible]);

  // --- 3. RENDERIZADO ---
  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D32F2F" />
      <Text style={{color: '#fff', marginTop: 10}}>Cargando Taxitab...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {location?.coords ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}  // ← Google Maps
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01, 
            longitudeDelta: 0.01,
          }}
        >
          {/* Ya NO hay UrlTile, Google Maps lo maneja solo */}
          <Marker 
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }} 
          >
            <View style={styles.taxiMarker}>
              <Text style={{fontSize: 30}}>🚕</Text>
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={{color: '#fff', marginTop: 10}}>Esperando señal GPS...</Text>
        </View>
      )}

      {/* Botón de pánico */}
      <TouchableOpacity 
        style={styles.panicButton} 
        onPress={() => setAlertVisible(true)}
      >
        <Text style={{fontSize: 25}}>🚨</Text>
      </TouchableOpacity>

      {/* Modal de Alerta */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ ALERTA DETECTADA</Text>
            <Text style={styles.alertText}>Se ha registrado un movimiento inusual. La central ha sido notificada.</Text>
            <TouchableOpacity style={styles.btnPanic} onPress={() => setAlertVisible(false)}>
              <Text style={styles.btnText}>ESTOY BIEN</Text>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  taxiMarker: { backgroundColor: 'rgba(255,255,255,0.7)', padding: 5, borderRadius: 20 },
  panicButton: { position: 'absolute', bottom: 30, right: 30, backgroundColor: 'red', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10, zIndex: 10 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { backgroundColor: '#1a1a1a', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%', borderColor: 'red', borderWidth: 1 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#ff0000', marginBottom: 15 },
  alertText: { color: '#ccc', textAlign: 'center', marginBottom: 25 },
  btnPanic: { backgroundColor: '#ff0000', padding: 15, borderRadius: 10, width: '100%' },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});