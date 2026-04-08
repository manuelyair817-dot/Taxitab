import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps'; 
import { db } from '../config/firebase'; 
import { collection, onSnapshot } from "firebase/firestore";

export default function AdminScreen() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // --- LLAVE DE TOMTOM (Misma que en MapaScreen) ---
  const tomtomKey = "mlOxpfn6qOelhLKtRM49tHwCtkU3nNkT";

  useEffect(() => {
    // Escucha en tiempo real la colección de conductores
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
    // Filtramos solo conductores que tengan coordenadas válidas
    const taxisConGPS = conductores.filter(c => 
      c.ubicacion && 
      typeof c.ubicacion.latitude === 'number' && 
      typeof c.ubicacion.longitude === 'number'
    );

    // Si hay taxis y el mapa está listo, centrar la vista en el primero o en un punto medio
    if (taxisConGPS.length > 0 && mapRef.current) {
      const pos = taxisConGPS[0].ubicacion;
      mapRef.current.animateToRegion({
        latitude: pos.latitude,
        longitude: pos.longitude,
        latitudeDelta: 0.08, // Un poco más amplio para ver varias unidades
        longitudeDelta: 0.08,
      }, 1000);
    }
  }, [conductores]);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D32F2F" />
      <Text style={{color: '#fff', marginTop: 10}}>Cargando Panel de Control...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 19.4326, 
          longitude: -99.1332,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* INTEGRACIÓN DE TOMTOM PARA EL ADMIN */}
        <UrlTile
          urlTemplate={`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${tomtomKey}`}
          maximumZ={19}
          zIndex={100} 
          shouldReplaceMapContent={true}
        />

        {conductores.map((taxi) => (
          taxi.ubicacion?.latitude && taxi.ubicacion?.longitude ? (
            <Marker 
              key={taxi.id}
              coordinate={{
                latitude: parseFloat(taxi.ubicacion.latitude),
                longitude: parseFloat(taxi.ubicacion.longitude)
              }}
              title={taxi.nombre || "Unidad"}
              description={taxi.alertaActiva ? "⚠️ ¡EMERGENCIA DETECTADA!" : "Estado: Normal"}
              zIndex={101}
            >
              <View style={[styles.marker, taxi.alertaActiva ? styles.alert : null]}>
                <Text style={{fontSize: 24}}>{taxi.alertaActiva ? "🚨" : "🚕"}</Text>
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
            <View style={[styles.card, item.alertaActiva ? {borderLeftColor: '#ff0000'} : {borderLeftColor: '#4CAF50'}]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.nombre || "Conductor Taxitab"}</Text>
                <Text style={styles.cardSub}>Email: {item.email || 'Sin registro'}</Text>
                <Text style={[styles.cardSub, { color: item.ubicacion ? '#4CAF50' : '#FF5252' }]}>
                  {item.ubicacion ? "● Localizado" : "○ Sin señal GPS"}
                </Text>
              </View>
              {item.alertaActiva && (
                <View style={styles.badgeAlert}>
                  <Text style={styles.alertText}>CHOQUE / GIRO</Text>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  listTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 10, fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 5 },
  cardName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cardSub: { color: '#888', fontSize: 12, marginTop: 2 },
  marker: { backgroundColor: '#fff', padding: 5, borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2, borderWidth: 1, borderColor: '#ddd' },
  alert: { backgroundColor: '#ff0000', borderColor: '#fff', borderWidth: 3 },
  badgeAlert: { backgroundColor: '#ff0000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  alertText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});