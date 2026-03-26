import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors'; // <--- SENSOR DE MOVIMIENTO

export default function MapaScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false); // Estado de la alerta
  const [subscription, setSubscription] = useState(null);

  // --- 1. LÓGICA DEL GPS ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos de ubicación para ver el mapa.');
        setLoading(false);
        return;
      }

      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc);
      setLoading(false);

      Location.watchPositionAsync({
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
      }, (newLoc) => {
        setLocation(newLoc);
      });
    })();
  }, []);

  // --- 2. LÓGICA DEL ACELERÓMETRO (Movimiento Brusco) ---
  const _subscribe = () => {
    setSubscription(
      Accelerometer.addListener(data => {
        const { x, y, z } = data;
        // Calculamos la fuerza G total
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        // Si la aceleración es mayor a 3 (un golpe o sacudida fuerte)
        if (acceleration > 3.0) { 
          setAlertVisible(true);
        }
      })
    );
    Accelerometer.setUpdateInterval(100);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Cargando Mapa de Taxitab...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAPA */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || 19.4326, 
          longitude: location?.coords.longitude || -99.1332,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Tu Taxi"
            description="Ivan Peres - AHT5E"
          >
            <Text style={{fontSize: 40}}>🚕</Text> 
          </Marker>
        )}
      </MapView>

      {/* --- MODAL DE ALERTA DE PÁNICO PERSONALIZADO --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={alertVisible}
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.warningIcon}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>
            
            <Text style={styles.alertTitle}>¡ALERTA DE IMPACTO!</Text>
            <Text style={styles.alertMessage}>
              Se detectó un movimiento brusco. ¿Necesitas asistencia de la base?
            </Text>

            <TouchableOpacity 
              style={styles.panicButton}
              onPress={() => {
                alert("Se ha enviado tu ubicación a la central de TAXITAB");
                setAlertVisible(false);
              }}
            >
              <Text style={styles.panicText}>SOLICITAR AYUDA</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setAlertVisible(false)}
            >
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
  
  // ESTILOS DE LA ALERTA (Basados en tu UI)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconText: { fontSize: 30 },
  alertTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  alertMessage: { color: '#bbb', textAlign: 'center', marginBottom: 20 },
  panicButton: {
    backgroundColor: '#ff0000',
    width: '100%',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  panicText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { padding: 10 },
  cancelText: { color: '#888', textDecorationLine: 'underline' },
});