import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Modal, Button, Alert } from "react-native";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { database } from "../config/firebase"; // Asegúrate de que la ruta sea correcta

export default function ListaComercios() {
    const [comercios, setComercios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedComercio, setSelectedComercio] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(database, "comercios"), (snapshot) => {
            const comerciosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComercios(comerciosData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const fetchUserData = async (userId) => {
        const userDoc = doc(database, "usuarios", userId);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
            setSelectedUser({ id: userSnapshot.id, ...userSnapshot.data() });
        } else {
            Alert.alert("Error", "No se encontró el usuario.");
        }
    };

    const openModal = (comercio) => {
        setSelectedComercio(comercio);
        fetchUserData(comercio.userId);
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText}>ID: {item.comercioId}</Text>
            <Text style={styles.itemText}>Razón Social: {item.razonSocial}</Text>
            <Text style={styles.itemText}>NIT: {item.nit}</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => openModal(item)}
            >
                <Text style={styles.buttonText}>Ver Detalles</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lista de Comercios</Text>
            <FlatList
                data={comercios}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
            />

            {/* Modal para mostrar detalles del comercio y usuario */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {selectedComercio && selectedUser && (
                        <>
                            <Text style={styles.modalTitle}>Detalles del Comercio</Text>
                            <Text style={styles.modalText}>ID Comercio: {selectedComercio.comercioId}</Text>
                            <Text style={styles.modalText}>Razón Social: {selectedComercio.razonSocial}</Text>
                            <Text style={styles.modalText}>NIT: {selectedComercio.nit}</Text>
                            <Text style={styles.modalTitle}>Detalles del Usuario</Text>
                            <Text style={styles.modalText}>ID Usuario: {selectedUser.id}</Text>
                            <Text style={styles.modalText}>Correo: {selectedUser.email}</Text>
                            <Text style={styles.modalText}>Teléfono: {selectedUser.phone}</Text>
                            <Button title="Cerrar" onPress={() => setModalVisible(false)} />
                        </>
                    )}
                </View>
            </Modal>
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
    listContainer: {
        paddingBottom: 20,
    },
    itemContainer: {
        padding: 15,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
    },
    itemText: {
        fontSize: 16,
    },
    button: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "orange",
        borderRadius: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#fff",
    },
    modalText: {
        fontSize: 18,
        color: "#fff",
    },
});
