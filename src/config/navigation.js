import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- IMPORTACIONES ÚNICAS ---
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import MapaScreen from '../screens/MapaScreen';
import LoginWithEmailScreen from '../screens/LoginWithEmailScreen';

const Stack = createStackNavigator();

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login" 
        screenOptions={{ headerShown: false }}
      >
        {/* Pantalla principal de bienvenida */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Pantalla de registro de usuario */}
        <Stack.Screen name="Registro" component={RegistroScreen} />
        
        {/* Pantalla del mapa principal */}
        <Stack.Screen name="Mapa" component={MapaScreen} />
        
        {/* Pantalla de inicio de sesión con email */}
        <Stack.Screen name="LoginEmail" component={LoginWithEmailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}