import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- IMPORTACIONES ---
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import MapaScreen from '../screens/MapaScreen';
import LoginWithEmailScreen from '../screens/LoginWithEmailScreen';
import AdminScreen from '../screens/AdminScreen'; // <--- Nueva pantalla

const Stack = createStackNavigator();

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login" 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
        <Stack.Screen name="Mapa" component={MapaScreen} />
        <Stack.Screen name="LoginEmail" component={LoginWithEmailScreen} />
        {/* Agregamos el acceso al Admin */}
        <Stack.Screen name="Admin" component={AdminScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}