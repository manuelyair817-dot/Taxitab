import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps'; 
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { db, auth } from '../config/firebase'; 
import { doc, updateDoc } from "firebase/firestore";

export default function MapaScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const mapRef = useRef(null);
  const tomtomKey = "mlOxpfn6qOelhLKtRM49tHwCtkU3nNkT";

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // 1. Pedir permisos con calma
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Necesitamos el GPS para trabajar.');
          if (isMounted) setLoading(false);
          return;
        }

        // 2. Obtener posición inicial estable
        const initial = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced 
        });
        
        if (isMounted) {
          setLocation(initial);
          setLoading(false);
        }

        // 3. Vigilancia pasiva (SIN animaciones automáticas que causan crash)
        await Location.watchPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Actualiza cada 5 seg para no saturar
          distanceInterval: 10,
        }, async (newLoc) => {
          if (!isMounted || !newLoc?.coords) return;

          const { latitude, longitude } = newLoc.coords;
          setLocation(newLoc);

          // Sincronizar con Firebase de forma silenciosa
          try {
            const user = auth.currentUser;
            if (user) {
              const conductorRef = doc(db, "conductores", user.uid);
              await updateDoc(conductorRef, {
                ubicacion: { latitude, longitude },
                ultimaConexion: new Date().toISOString()
              });
            }
          } catch (e) { console.log("Fbc Error:", e.message); }
        });

      } catch (err) {
        console.log("GPS Crash Prevention:", err);
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  // --- Sensores con intervalo más relajado ---
  useEffect(() => {
    const subAccel = Accelerometer.addListener(data => {
      const force = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      if (force > 4.5) setAlertVisible(true);
    });

    Accelerometer.setUpdateInterval(500); // 0.5 segundos
    return () => subAccel.remove();
  }, []);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D32F2F" />
      <Text style={{color: '#fff', marginTop: 10}}>Cargando Taxitab...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords?.latitude || 19.4326,
          longitude: location?.coords?.longitude || -99.1332,
          latitudeDelta: 0.01, 
          longitudeDelta: 0.01,
        }}
      >
        <UrlTile
          urlTemplate={`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${tomtomKey}`}
          maximumZ={19}
          zIndex={1}
        />

        {location?.coords && (
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
        )}
      </MapView>

      {/* Botón manual de pánico por si acaso */}
      <TouchableOpacity 
        style={styles.panicButton} 
        onPress={() => setAlertVisible(true)}
      >
        <Text style={{fontSize: 25}}>🚨</Text>
      </TouchableOpacity>

      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>ALERTA</Text>
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
  panicButton: { position: 'absolute', bottom: 30, right: 30, backgroundColor: 'red', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { backgroundColor: '#1a1a1a', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%' },
  alertTitle: { fontSize: 22, fontWeight: 'bold', color: '#ff0000', marginBottom: 20 },
  btnPanic: { backgroundColor: '#ff0000', padding: 15, borderRadius: 10, width: '100%' },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});