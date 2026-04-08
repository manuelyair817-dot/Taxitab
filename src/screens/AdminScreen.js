import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps'; // Quitamos PROVIDER_GOOGLE
import { db } from '../config/firebase'; 
import { collection, onSnapshot } from "firebase/firestore";

export default function AdminScreen() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "conductores"), (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ubicacion && data.ubicacion.latitude && data.ubicacion.longitude) {
          docs.push({ id: doc.id, ...data });
        }
      });
      setConductores(docs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (conductores.length > 0 && mapRef.current) {
      const primerTaxi = conductores[0].ubicacion;
      mapRef.current.animateToRegion({
        latitude: primerTaxi.latitude,
        longitude: primerTaxi.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 1000);
    }
  }, [loading]);

  if (loading) return (
    <View style={styles.loading}><ActivityIndicator size="large" color="#D32F2F" /></View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 19.4326, 
          longitude: -99.1332,
          latitudeDelta: 0.07,
          longitudeDelta: 0.07,
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={100}
        />

        {conductores.map((taxi) => (
          <Marker 
            key={taxi.id}
            coordinate={{
              latitude: taxi.ubicacion.latitude,
              longitude: taxi.ubicacion.longitude
            }}
            title={taxi.nombre || "Unidad"}
            description={`Placas: ${taxi.placas || 'S/N'}`}
            zIndex={101}
          >
            <View style={[styles.marker, taxi.alertaActiva ? styles.alert : null]}>
              <Text style={{fontSize: 24}}>{taxi.alertaActiva ? "⚠️" : "🚕"}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>UNIDADES EN CIRCULACIÓN ({conductores.length})</Text>
        <FlatList
          data={conductores}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.cardName}>{item.nombre || "Chofer"}</Text>
                <Text style={styles.cardSub}>Placas: {item.placas || 'N/A'}</Text>
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
  container: { flex: 1 },
  map: { flex: 0.65 },
  listContainer: { flex: 0.35, backgroundColor: '#000', padding: 15 },
  loading: { flex: 1, justifyContent: 'center', backgroundColor: '#000' },
  listTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 10, fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#D32F2F' },
  cardName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cardSub: { color: '#888', fontSize: 12 },
  marker: { backgroundColor: '#fff', padding: 5, borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3 },
  alert: { backgroundColor: '#ff0000', borderColor: '#fff', borderWidth: 2 },
  badgeAlert: { backgroundColor: '#ff0000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  alertText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});