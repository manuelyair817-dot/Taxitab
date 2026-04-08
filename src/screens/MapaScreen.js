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
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permiso de GPS denegado');
        setLoading(false);
        return;
      }

      // Obtener ubicación inicial con tiempo de espera (timeout) para evitar bloqueos
      try {
        let initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(initial);
      } catch (error) {
        console.log("Error ubicación inicial:", error);
      }
      
      setLoading(false);

      // Vigilancia de posición con seguros
      await Location.watchPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 5,
      }, async (newLoc) => {
        if (!newLoc || !newLoc.coords) return; // SEGURO 1: Evita procesar datos nulos

        const { latitude, longitude } = newLoc.coords;
        setLocation(newLoc);

        // SEGURO 2: Solo anima si el mapa ya cargó (mapRef.current no es null)
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000); 
        }

        try {
          const user = auth.currentUser;
          if (user) {
            const conductorRef = doc(db, "conductores", user.uid);
            await updateDoc(conductorRef, {
              ubicacion: { latitude, longitude },
              ultimaConexion: new Date().toISOString()
            });
          }
        } catch (e) { console.log("Error Firebase Sync:", e.message); }
      });
    })();
  }, []);

  useEffect(() => {
    const subAccel = Accelerometer.addListener(data => {
      const force = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      if (force > 3.8) setAlertVisible(true);
    });

    const subGyro = Gyroscope.addListener(async (data) => {
      if (Math.abs(data.z) > 4.5) { 
        const user = auth.currentUser;
        if (user) {
          const conductorRef = doc(db, "conductores", user.uid);
          try {
            await updateDoc(conductorRef, { 
              alertaActiva: true, 
              tipoAlerta: "Giro Brusco",
              fechaAlerta: new Date().toISOString()
            });
          } catch (e) { console.log("Error Gyro Sync:", e); }
        }
      }
    });

    Accelerometer.setUpdateInterval(200);
    Gyroscope.setUpdateInterval(200);

    return () => {
      subAccel.remove();
      subGyro.remove();
    };
  }, []);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D32F2F" />
      <Text style={{color: '#fff', marginTop: 10}}>Iniciando sistemas de Taxitab...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        // SEGURO 3: Coordenadas por defecto si location es null al inicio
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
          zIndex={100}
          shouldReplaceMapContent={true}
        />

        {location?.coords && (
          <Marker 
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }} 
            title="Mi Taxi"
            zIndex={101}
          >
            <View style={styles.taxiMarker}>
                <Text style={{fontSize: 30}}>🚕</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <Modal visible={alertVisible} transparent={true} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ ¡MOVIMIENTO BRUSCO!</Text>
            <Text style={styles.alertText}>Se ha detectado una maniobra de riesgo en la unidad.</Text>
            <TouchableOpacity 
                style={styles.btnPanic} 
                onPress={() => {
                    Alert.alert("NOTIFICADO", "La central ha recibido tu ubicación.");
                    setAlertVisible(false);
                }}
            >
              <Text style={styles.btnText}>SOLICITAR AYUDA</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAlertVisible(false)}>
              <Text style={styles.btnCancel}>IGNORAR</Text>
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
  taxiMarker: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 5, borderRadius: 20 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { backgroundColor: '#1a1a1a', padding: 25, borderRadius: 20, alignItems: 'center', width: '85%', borderColor: '#ff0000', borderWidth: 2 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#ff0000', marginBottom: 10 },
  alertText: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  btnPanic: { backgroundColor: '#ff0000', padding: 15, borderRadius: 25, width: '100%' },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  btnCancel: { marginTop: 20, color: '#888', textDecorationLine: 'underline' }
});