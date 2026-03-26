import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Image, ImageBackground } from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Si tienes una imagen de fondo con rombos, puedes usar ImageBackground aquí */}
      <SafeAreaView style={styles.content}>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brand}>TAXITAB</Text>
          <Text style={styles.slogan}>Conectando Conductores</Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* BOTÓN INICIAR SESIÓN (Rojo intenso) */}
          <TouchableOpacity 
            style={styles.redButton}
            onPress={() => navigation.navigate('LoginEmail')}
          >
            <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>

          {/* BOTÓN REGISTRARSE (Rojo intenso) */}
          <TouchableOpacity 
            style={styles.redButton}
            onPress={() => navigation.navigate('Registro')}
          >
            <Text style={styles.buttonText}>REGISTRARSE</Text>
          </TouchableOpacity>

          {/* BOTÓN GOOGLE */}
          <TouchableOpacity style={styles.googleButton}>
            <View style={styles.googleContent}>
              <Text style={styles.googleText}>G  CONTINUAR CON GOOGLE</Text>
            </View>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fondo negro profundo
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  brand: {
    color: '#00B4D8', // Color azul cyan parecido al del logo
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  slogan: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  redButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#C00000', // Rojo oscuro
    borderRadius: 30, // Forma de cápsula
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF0000', // Borde brillante para efecto 3D
    elevation: 8, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  googleButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#D1D1D1',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  }
});