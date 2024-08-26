import React, { useEffect, useState,useContext  } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { getFirestore, collection, query, where, getDocs, addDoc,doc, updateDoc,onSnapshot,getDoc } from "firebase/firestore"; 
import { AutenticadoContexto } from '../App'; // Ensure the path is correct
const db = getFirestore(); // Initialize Firestore

const DetalleDomicilio = ({ route }) => {
    const { domicilioId } = route.params; // Obtener el ID del domicilio desde los parámetros
    const [domicilio, setDomicilio] = useState(null);
    const [showRecogidoButton, setShowRecogidoButton] = useState(true);
    const { user } = useContext(AutenticadoContexto); // Access the context
    const [userData, setUserData] = useState(null); // State to store user data
    useEffect(() => {
        const fetchDomicilio = async () => {
            const domicilioRef = doc(db, "domicilio", domicilioId);
            const docSnap = await getDoc(domicilioRef);
            if (docSnap.exists()) {
                setDomicilio(docSnap.data());
                console.log(docSnap.data())
            } else {
                Alert.alert('Error', `No existe un domicilio con ID: ${domicilioId}`);
            }
        };

        fetchDomicilio();
        if (user) {
            fetchUserData(user.email);
        }


    }, [domicilioId]);


    const fetchUserData = async (email) => {
        try {
            const q = query(collection(db, "usuarios"), where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                setUserData(userDoc.data());
               
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstado = async (nuevoEstado) => {
        // Aquí puedes llamar a la función actualizarEstadoDomicilio
        await actualizarEstadoDomicilio(domicilioId, nuevoEstado, userData.userId);
        if (nuevoEstado == 'Pedido Entregado') {
            // Redirige a la vista Inicio.js
            navigation.navigate('Inicio'); // Asegúrate de que 'Inicio' esté registrado en tu navegación
        } else {
            setShowRecogidoButton(false);
        }
    };

       
    const actualizarEstadoDomicilio = async (domicilioId, nuevoEstado, userId) => {
        try {
            const domicilioRef = doc(db, "domicilio", domicilioId);
            
            // Verificar si el documento existe
            const docSnap = await getDoc(domicilioRef);
            if (!docSnap.exists()) {
                throw new Error(`No existe un documento con el ID: ${domicilioId}`);
            }
    
            // Actualizar el estado y agregar el campo domiciliarioAsignado
            await updateDoc(domicilioRef, {
                estado: nuevoEstado,
                domiciliarioAsignado: userId // Agrega el campo domiciliarioAsignado
            });
            
            // Actualiza el estado local
            setDomicilios(prevDomicilios => 
                prevDomicilios.map(domicilio => 
                    domicilio.domicilioId === domicilioId 
                        ? { ...domicilio, estado: nuevoEstado, domiciliarioAsignado: userId } // Cambia el estado localmente
                        : domicilio
                )
            );
            navigation.navigate('DetalleDomicilio', { domicilioId });
            await sendNotificationDomicilio();
            
        } catch (error) {
            console.error("Error actualizando el estado del domicilio:", error);
            alert(`Error: ${error.message}`); // Muestra un mensaje de error
        }
    };


    if (!domicilio) {
        return <Text>Cargando...</Text>; // Puedes mostrar un indicador de carga
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Comercio: {domicilio.nombreComercio}</Text>
                <Text style={styles.text}>DireccionComercio: {domicilio.direccionComercio}</Text>
                <Text style={styles.text}>Nombre Cliente: {domicilio.contacto}</Text>
                <Text style={styles.text}>Telefono cliente: {domicilio.telefono}</Text>
                <Text style={styles.text}>Direccion: {domicilio.direccionCliente}</Text>
                <Text style={styles.text}>Observacion: {domicilio.direccion}</Text>
                <Text style={styles.text}>Estado: {domicilio.estado}</Text>
                <Text style={styles.text}>Domiciliario Asignado: {domicilio.domiciliarioAsignado || 'No asignado'}</Text>
                {/* Agrega más campos según sea necesario */}

                {showRecogidoButton ? (
                    <Button title="Recogido" onPress={() => cambiarEstado('Recogido Comercio')} />
                ) : (
                    <Button title="Pedido Entregado" onPress={() => cambiarEstado('Pedido Entregado')} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    text: {
        fontSize: 16,
        marginBottom: 4,
    },
});

export default DetalleDomicilio;