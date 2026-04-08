import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps'; 
import { db } from '../config/firebase'; 
import { collection, onSnapshot } from "firebase/firestore";

export default function AdminScreen() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    // 1. CORRECCIÓN DE COLECCIÓN: Asegúrate que en Firebase sea "conductores"
    // Si en tu captura la colección tiene otro nombre, cámbialo aquí.
    const unsub = onSnapshot(collection(db, "conductores"), (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setConductores(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error en Firebase:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    // 2. CORRECCIÓN DE MOVIMIENTO: Solo si el taxi tiene ubicación numérica real
    const taxisConGPS = conductores.filter(c => 
      c.ubicacion && 
      typeof c.ubicacion.latitude === 'number' && 
      typeof c.ubicacion.longitude === 'number'
    );

    if (taxisConGPS.length > 0 && mapRef.current) {
      const pos = taxisConGPS[0].ubicacion;
      mapRef.current.animateToRegion({
        latitude: pos.latitude,
        longitude: pos.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 1000);
    }
  }, [conductores]);

  if (loading) return (
    <View style={styles.loading}><ActivityIndicator size="large" color="#D32F2F" /></View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        // Región inicial por defecto (Centro de México o tu zona)
        initialRegion={{
          latitude: 19.4326, 
          longitude: -98.1332,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={100} 
        />

        {conductores.map((taxi) => (
          // 3. CORRECCIÓN DE RENDERIZADO: Validar que la ubicación exista antes de dibujar el Marker
          taxi.ubicacion?.latitude && taxi.ubicacion?.longitude ? (
            <Marker 
              key={taxi.id}
              coordinate={{
                latitude: parseFloat(taxi.ubicacion.latitude),
                longitude: parseFloat(taxi.ubicacion.longitude)
              }}
              title={taxi.nombre || "Unidad"}
              zIndex={101}
            >
              <View style={[styles.marker, taxi.alertaActiva ? styles.alert : null]}>
                <Text style={{fontSize: 24}}>{taxi.alertaActiva ? "⚠️" : "🚕"}</Text>
              </View>
            </Marker>
          ) : null
        ))}
      </MapView>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>UNIDADES EN CIRCULACIÓN ({conductores.length})</Text>
        <FlatList
          data={conductores}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.nombre || "Usuario de Prueba"}</Text>
                <Text style={styles.cardSub}>Placas: {item.placas || 'S/N'}</Text>
                <Text style={[styles.cardSub, { color: item.ubicacion ? '#4CAF50' : '#FF5252' }]}>
                  {item.ubicacion ? "● Conectado (GPS)" : "○ Desconectado"}
                </Text>
              </View>
              {item.alertaActiva && (
                <View style={styles.badgeAlert}>
                  <Text style={styles.alertText}>EMERGENCIA</Text>
                </View>
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 0.65 },
  listContainer: { flex: 0.35, backgroundColor: '#000', padding: 15 },
  loading: { flex: 1, justifyContent: 'center', backgroundColor: '#000' },
  listTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 10, fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#D32F2F' },
  cardName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cardSub: { color: '#888', fontSize: 12, marginTop: 2 },
  marker: { backgroundColor: '#fff', padding: 5, borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2 },
  alert: { backgroundColor: '#ff0000', borderColor: '#fff', borderWidth: 2 },
  badgeAlert: { backgroundColor: '#ff0000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  alertText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});