import React, { useState, createContext, useContext, useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";

import Chat from "./screens/Chat";
import Login from "./screens/Login";
import Registro from "./screens/Registro";
import Inicio from "./screens/Inicio";
import DetalleDomicilio from './screens/DetalleDomicilio';
import { auth } from "./config/firebase";

const Stack = createNativeStackNavigator();
export const AutenticadoContexto = createContext({});
const AutenticadoProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <AutenticadoContexto.Provider value={{ user, setUser }}>
      {children}
    </AutenticadoContexto.Provider>
  );
};

function Logeado() {
  return (
    <Stack.Navigator defaultScreenOptions={Inicio}>
      <Stack.Screen name="Inicio" component={Inicio} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="DetalleDomicilio" component={DetalleDomicilio} />
    </Stack.Navigator>
  );
}

function SinLogeado() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} defaultScreenOptions={Login}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Registro" component={Registro} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, setUser } = useContext(AutenticadoContexto);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async authenticatedUser => {
      authenticatedUser ? setUser(authenticatedUser) : setUser(null);
      setLoading(false);
      if (authenticatedUser) {
        await sendNotification(); // Envía la notificación al iniciar sesión
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    registerForPushNotificationsAsync(); // Registra las notificaciones al iniciar
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  async function sendNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "¡Bienvenido!",
        body: "Has iniciado sesión correctamente.",
      },
      trigger: { seconds: 1 },
    });
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <Logeado /> : <SinLogeado />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AutenticadoProvider>
      <RootNavigator />
    </AutenticadoProvider>
  );
}
