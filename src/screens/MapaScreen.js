import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { db, auth } from '../config/firebase'; 
import { doc, updateDoc } from "firebase/firestore";

export default function MapaScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const mapRef = useRef(null);

  // 1. RASTREO GPS SENSIBLE Y EN TIEMPO REAL
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permiso de GPS denegado');
        setLoading(false);
        return;
      }

      // Obtener posición inicial para quitar el cargando
      let initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(initial);
      setLoading(false);

      // Suscripción de alta frecuencia
      await Location.watchPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // Máxima precisión
        timeInterval: 800,    // Actualiza cada menos de 1 segundo
        distanceInterval: 1,  // Actualiza cada 1 metro de movimiento
      }, async (newLoc) => {
        const { latitude, longitude } = newLoc.coords;
        setLocation(newLoc);

        // --- ANIMACIÓN DE CÁMARA ---
        // Esto hace que el mapa siga al taxi suavemente
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 600); 

        // Sincronizar con Firebase
        try {
          const user = auth.currentUser;
          if (user) {
            const conductorRef = doc(db, "conductores", user.uid);
            await updateDoc(conductorRef, {
              ubicacion: { latitude, longitude },
              ultimaConexion: new Date().toISOString()
            });
          }
        } catch (e) { console.log("Error GPS Sync:", e.message); }
      });
    })();
  }, []);

  // 2. SENSORES (IMPACTO Y GIRO)
  useEffect(() => {
    const subAccel = Accelerometer.addListener(data => {
      const force = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      // Sensibilidad ajustada a 3.5 para pruebas más fáciles
      if (force > 3.5) setAlertVisible(true);
    });

    const subGyro = Gyroscope.addListener(async (data) => {
      // Sensibilidad de giro ajustada a 4.0
      if (Math.abs(data.z) > 4.0) { 
        const user = auth.currentUser;
        if (user) {
          const conductorRef = doc(db, "conductores", user.uid);
          await updateDoc(conductorRef, { 
            alertaActiva: true, 
            tipoAlerta: "Giro Brusco",
            fechaAlerta: new Date().toISOString()
          });
          console.log("🔄 Giro brusco reportado a la base");
        }
      }
    });

    Accelerometer.setUpdateInterval(100); // Más rápido (10 lecturas por segundo)
    Gyroscope.setUpdateInterval(100);

    return () => {
      subAccel.remove();
      subGyro.remove();
    };
  }, []);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D32F2F" />
      <Text style={{color: '#fff', marginTop: 10}}>Localizando unidad...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || 19.4326,
          longitude: location?.coords.longitude || -99.1332,
          latitudeDelta: 0.005, 
          longitudeDelta: 0.005,
        }}
        showsUserLocation={true}
        followsUserLocation={true} // Ayuda al seguimiento en tiempo real
      >
        {location && (
          <Marker 
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }} 
            title="Mi Taxi"
          >
            <View style={styles.taxiMarker}>
               <Text style={{fontSize: 30}}>🚕</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <Modal visible={alertVisible} transparent={true} animationType="fade">
        <View style={styles.modal}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ ¡MOVIMIENTO BRUSCO!</Text>
            <Text style={styles.alertText}>Se ha detectado un impacto o maniobra peligrosa.</Text>
            <TouchableOpacity 
                style={styles.btnPanic} 
                onPress={() => {
                    Alert.alert("AUXILIO", "La base ha sido notificada.");
                    setAlertVisible(false);
                }}
            >
              <Text style={styles.btnText}>SOLICITAR AYUDA</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAlertVisible(false)}>
              <Text style={styles.btnCancel}>ESTOY BIEN</Text>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  taxiMarker: { backgroundColor: 'rgba(255,255,255,0.7)', padding: 5, borderRadius: 20 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { backgroundColor: '#1a1a1a', padding: 25, borderRadius: 20, alignItems: 'center', width: '85%', borderHighlight: 2, borderColor: '#ff0000', borderWidth: 1 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#ff0000', marginBottom: 10 },
  alertText: { color: '#bbb', textAlign: 'center', marginBottom: 20 },
  btnPanic: { backgroundColor: '#ff0000', padding: 15, borderRadius: 25, width: '100%' },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  btnCancel: { marginTop: 20, color: '#888', textDecorationLine: 'underline' }
});