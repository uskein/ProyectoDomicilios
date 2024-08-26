import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Alert } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { database } from "../config/firebase"; // Asegúrate de que la ruta sea correcta

export default function DetalleComercio({ route, navigation }) {
    const { comercioId } = route.params; // Obtener el ID del comercio desde los parámetros de la ruta
    const [razonSocial, setRazonSocial] = useState("");
    const [nit, setNit] = useState("");

    useEffect(() => {
        const fetchComercioData = async () => {
            const comercioDoc = doc(database, "comercios", comercioId);
            const comercioSnapshot = await getDoc(comercioDoc);
            if (comercioSnapshot.exists()) {
                const data = comercioSnapshot.data();
                setRazonSocial(data.razonSocial);
                setNit(data.nit);
            } else {
                Alert.alert("Error", "Comercio no encontrado.");
            }
        };

        fetchComercioData();
    }, [comercioId]);

    const handleUpdate = async () => {
        const comercioDoc = doc(database, "comercios", comercioId);
        await updateDoc(comercioDoc, {
            razonSocial: razonSocial,
            nit: nit,
        });
        Alert.alert("Éxito", "Datos del comercio actualizados.");
        navigation.goBack(); // Regresar a la lista de comercios
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Detalles del Comercio</Text>
            <TextInput
                style={styles.input}
                placeholder="Razón Social"
                value={razonSocial}
                onChangeText={setRazonSocial}
            />
            <TextInput
                style={styles.input}
                placeholder="NIT"
                value={nit}
                onChangeText={setNit}
            />
            <Pressable style={styles.button} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Actualizar Comercio</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        backgroundColor: "#F6F7FB",
        height: 50,
        marginBottom: 20,
        fontSize: 16,
        borderRadius: 10,
        padding: 12,
    },
    button: {
        height: 50,
        backgroundColor: "orange",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});
