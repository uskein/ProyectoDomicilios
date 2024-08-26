import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, Alert, Image, StatusBar } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import colors from "../colors";

const ImagenFondo = require("../assets/fondo.jpg");

export default function Login({ navigation }) {
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    const EnvioLogin = () => {
        if (email !== "" && password !== "") {
          signInWithEmailAndPassword(auth, email, password)
            .then(() => {
              console.log("Sesión Iniciada Con Éxito");
              sendNotification(); // Envía la notificación después del inicio de sesión exitoso
            })
            .catch((err) => Alert.alert("Error en el login", err.message));
        } else {
          Alert.alert("Error", "Por favor, completa todos los campos.");
        }
      };
      
      async function sendNotification() {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "¡Bienvenido!",
            body: "Has iniciado sesión correctamente.",
          },
          trigger: { seconds: 1 },
        });
      }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <div  style={styles.backImage} resizeMode="cover" ></div>
            <View style={styles.whiteSheet} />
            <SafeAreaView style={styles.form}>
                <Text style={styles.title}>Login</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Correo"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoFocus={true}
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={true}
                    textContentType="password"
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                />
                <Pressable style={styles.button} onPress={EnvioLogin}>
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                </Pressable>
                <View style={{marginTop: 20, flexDirection:"row", alignItems: "center"}} >
                    <Text style={{color: "gray", fontWeight:"600",fontSize: 14 }} >
                        No Tienes Cuenta Registrate?,
                        <Pressable onPress={()=> navigation.navigate("Registro")}>
                        <Text style={{color: colors.secondary, fontWeight:"600",fontSize: 14 }} >
                        registrarme</Text>
                        </Pressable>
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color:  colors.primary,
        alignSelf: "center",
        paddingBottom: 24,
    },
    input: {
        backgroundColor: "#F6F7FB",
        height: 58,
        marginBottom: 20,
        fontSize: 16,
        borderRadius: 10,
        padding: 12,
    },
    backImage: {
        width: "100%",
        height: "100%",
        position: "absolute",
        bottom: 0,
        backgroundColor: colors.primary
    },
    whiteSheet: {
        width: "100%",
        height: "75%",
        position: "absolute",
        bottom: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
    },
    form: {
       flex: 1,
       justifyContent: "center",
       marginHorizontal: 30
    },
    button: {
        height: 50,
        width: "100%",
        backgroundColor:  colors.primary,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40
    },
    buttonText: {
        fontWeight: "bold",
        color: "#fff",
        fontSize: 18,
    },
});