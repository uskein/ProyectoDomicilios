import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Alert } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { database } from "../config/firebase"; // Asegúrate de que la ruta sea correcta

export default function DetalleDomiciliario({ route, navigation }) {
    const { domiciliarioId } = route.params; // Obtener el ID del domiciliario desde los parámetros de la ruta
    const [formaDePago, setFormaDePago] = useState("Nequi");
    const [nombreBanco, setNombreBanco] = useState("");
    const [numeroCuenta, setNumeroCuenta] = useState("");
    const [tipoTransporte, setTipoTransporte] = useState("Moto");

    useEffect(() => {
        const fetchDomiciliarioData = async () => {
            const domiciliarioDoc = doc(database, "domiciliarios", domiciliarioId);
            const domiciliarioSnapshot = await getDoc(domiciliarioDoc);
            if (domiciliarioSnapshot.exists()) {
                const data = domiciliarioSnapshot.data();
                setFormaDePago(data.formaDePago);
                setNombreBanco(data.nombreBanco);
                setNumeroCuenta(data.numeroCuenta);
                setTipoTransporte(data.tipoTransporte);
            } else {
                Alert.alert("Error", "Domiciliario no encontrado.");
            }
        };

        fetchDomiciliarioData();
    }, [domiciliarioId]);

    const handleUpdate = async () => {
        const domiciliarioDoc = doc(database, "domiciliarios", domiciliarioId);
        await updateDoc(domiciliarioDoc, {
            formaDePago: formaDePago,
            nombreBanco: nombreBanco,
            numeroCuenta: numeroCuenta,
            tipoTransporte: tipoTransporte,
        });
        Alert.alert("Éxito", "Datos del domiciliario actualizados.");
        navigation.goBack(); // Regresar a la lista de domiciliarios
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Detalles del Domiciliario</Text>
            <TextInput
                style={styles.input}
                placeholder="Forma de Pago"
                value={formaDePago}
                onChangeText={setFormaDePago}
            />
            {formaDePago === "Banco" && (
                <TextInput
                    style={styles.input}
                    placeholder="Nombre del Banco"
                    value={nombreBanco}
                    onChangeText={setNombreBanco}
                />
            )}
            <TextInput
                style={styles.input}
                placeholder="Número de Cuenta"
                value={numeroCuenta}
                onChangeText={setNumeroCuenta}
            />
            <TextInput
                style={styles.input}
                placeholder="Tipo de Transporte"
                value={tipoTransporte}
                onChangeText={setTipoTransporte}
            />
            <Pressable style={styles.button} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Actualizar Domiciliario</Text>
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
