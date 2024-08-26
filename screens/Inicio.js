import React, { useEffect, useContext, useState } from "react";
import { View, Text, Image, StyleSheet, Pressable, Modal, TextInput, Button, Picker, FlatList, ActivityIndicator,Linking  } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from '@expo/vector-icons';
import colors from '../colors';
import { Entypo } from '@expo/vector-icons';
import { AutenticadoContexto } from '../App'; // Ensure the path is correct
import { getFirestore, collection, query, where, getDocs, addDoc,doc, updateDoc,onSnapshot } from "firebase/firestore"; 
import { getDoc } from "firebase/firestore"; // Asegúrate de importar getDoc
import { auth } from "../config/firebase"; // Adjust the path according to your folder structure
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { signOut } from "firebase/auth";

const catImageUrl = "https://i.guim.co.uk/img/media/26392d05302e02f7bf4eb143bb84c8097d09144b/446_167_3683_2210/master/3683.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=49ed3252c0b2ffb49cf8b508892e452d";
const phoneNumber = '123';

const Inicio = () => {
    const navigation = useNavigation();
    const { user } = useContext(AutenticadoContexto); // Access the context
    const db = getFirestore(); // Initialize Firestore
    const [userData, setUserData] = useState(null); // State to store user data
    const [modalVisible, setModalVisible] = useState(false); // State to control the modal
    const [formData, setFormData] = useState({ nombre: '', direccion: '', telefono: '', observacion:'', direccionCliente: ''  }); // State for the form
    const [comercioData, setComercioData] = useState(null); // State to store commerce data
    const [direcciones, setDirecciones] = useState([]); // State to store addresses
    const [selectedDireccion, setSelectedDireccion] = useState(''); // State for the selected address
    const [domicilios, setDomicilios] = useState([]);
    const [loading, setLoading] = useState(true); // State to handle loading
    const [domiciliosparaDomi, setDomiciliosparaDomi] = useState([]);
    const mapCenter = { lat: 37.78825, lng: -122.4324 };

    useEffect(() => {
        const requestNotificationPermission = async () => {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                await Notifications.requestPermissionsAsync();
            }
        };

        requestNotificationPermission();

        // Configurar el manejador de notificaciones
        const subscription = Notifications.addNotificationReceivedListener(notification => {
            console.log("Notificación recibida:", notification);
            // Llama a las funciones cuando se recibe una notificación
            fetchDomicilios();
            fetchDomiciliosParaDomiciliario();
        });


        navigation.setOptions({
            headerLeft: () => (
                <FontAwesome name="search" size={24} color={colors.gray} style={{ marginLeft: 15 }} />
            ),
            headerRight: () => (
                <>
                <Pressable onPress={handleCall}>
                <Image
                    source={{ uri: catImageUrl }}
                    style={{ width: 40, height: 40, marginRight: 15 }}
                />
                </Pressable>
            </>

            ),
        });

        if (user) {
            fetchUserData(user.email);
        }
        return () => {
            subscription.remove();
        };
    }, [navigation, user]);
    const Salir = () => {
        signOut(auth).catch(error => console.log(error));
    };
    
    const fetchUserData = async (email) => {
        try {
            const q = query(collection(db, "usuarios"), where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                setUserData(userDoc.data());
                // Fetch comercio and domicilios based on user type
                if (userDoc.data().tipousuario === "Comercio") {
                    fetchComercioData(userDoc.data().userId);
                } else if (userDoc.data().tipousuario === "Domiciliario") {
                    fetchDomiciliosParaDomiciliario();
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };


    const fetchComercioData = async (userId) => {
        try {
            const q = query(collection(db, "comercios"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                setComercioData(doc.data()); // Store commerce data in state
                fetchDireccionesComercio(doc.data().comercioId); // Call the function to get commerce addresses
                fetchDomicilios(doc.data().comercioId);
            });
        } catch (error) {
            console.error("Error fetching commerce data:", error);
        }
    };


    const fetchDireccionesComercio = async (comercioId) => {
        try {
            const q = query(collection(db, "direccionesComercio"), where("comercioId", "==", comercioId));
            const querySnapshot = await getDocs(q);
            const direccionesArray = [];
            querySnapshot.forEach((doc) => {
                console.log("Commerce address:", doc.id, " => ", doc.data());
                direccionesArray.push(doc.data().descripcion); // Assuming you have a 'descripcion' field
            });
            setDirecciones(direccionesArray); // Store addresses in state
        } catch (error) {
            console.error("Error fetching commerce addresses:", error);
        }
    };


    const handleFormSubmit = async () => {
        try {
            const domicilioRef = collection(db, "domicilio");
            const newDomicilio = {
                direccionComercio: selectedDireccion,
                comercioId: comercioData.comercioId,
                direccion: formData.observacion,
                telefono: formData.telefono,
                contacto: formData.nombre,
                direccionCliente: formData.direccionCliente,
                estado: "Sin asignar",
                domicilioId: generateGUID(),
                nombreComercio: comercioData.razonSocial,
                fecha: new Date().toISOString()
            };

            await addDoc(domicilioRef, newDomicilio);
            sendNotification(); 

            // Reset the form after submission
            setFormData({ nombre: '', direccion: '', telefono: '', observacion: '', direccionCliente: '' });
            setSelectedDireccion('');
            setModalVisible(false); // Close the modal after submission

            const clienteRef = collection(db, "clientes");
            const newCliente = {
                clienteid: generateGUID(),
                nombre: formData.nombre,
                direccion: formData.direccion,
                telefono: formData.telefono,
            };
            await addDoc(clienteRef, newCliente);
        } catch (error) {
            console.error("Error saving domicilio:", error);
        }
    };

    const fetchDomicilios = (comercioId) => {
        // Obtener la fecha actual
        const today = new Date();
        // Establecer el inicio y el final del día actual
        const startOfDay = Timestamp.fromDate(new Date(today.setHours(0, 0, 0, 0)));
        const endOfDay = Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999)));
    
        // Crear la consulta con las condiciones necesarias
        const q = query(
            collection(db, "domicilio"),
            where("comercioId", "==", comercioId),
            where("fecha", ">=", startOfDay), // Filtrar domicilios a partir del inicio del día
            where("fecha", "<=", endOfDay) // Filtrar domicilios hasta el final del día
        );
    
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const domiciliosArray = [];
            querySnapshot.forEach((doc) => {
                console.log("Domicilio:", doc.id, " => ", doc.data());
                domiciliosArray.push(doc.data()); // Almacenar domicilios en el array
            });
    
            domiciliosArray.sort((a, b) => {
                // Asegúrate de que el campo de fecha esté en formato de fecha
                return new Date(b.fecha) - new Date(a.fecha); // Ordenar de más reciente a más antiguo
            });
    
            setDomicilios(domiciliosArray); // Almacenar domicilios en el estado
            console.log("Colección 'domicilio' ha sido modificada para comercioId:", comercioId);
        });
    
        return unsubscribe;
    }
    
    const fetchDomiciliosParaDomiciliario = () => {
        const q = query(collection(db, "domicilio"), where("estado", "==", "Sin asignar"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const domiciliosParaDomArray = [];
            querySnapshot.forEach((doc) => {
                console.log("DomiciliosPorEntregar:", doc.id, " => ", doc.data());
                domiciliosParaDomArray.push({ ...doc.data(), domicilioId: doc.id }); // Incluye el ID del documento
            });

            domiciliosParaDomArray.sort((a, b) => {
                // Asegúrate de que el campo de fecha esté en formato de fecha
                return new Date(b.fecha) - new Date(a.fecha); // Ordenar de más reciente a más antiguo
            });


            setDomiciliosparaDomi(domiciliosParaDomArray); // Store domicilios in state
            console.log("Colección 'domicilio' ha sido modificada");
        });
        return unsubscribe;
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
                        ? { ...domicilio, estado: nuevoEstado, domiciliarioAsignado: userID } // Cambia el estado localmente
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

    // Function to generate a GUID
    function generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async function sendNotification() {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "¡Domicilio Creado Con exito!",
                body: "A La Espera de Asignacion de domiciliario.",
            },
            trigger: { seconds: 1 },
        });
    }
    const sendNotificationDomicilio = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "¡Domicilio Aceptado Con Exito!",
                body: "El Comercio Ya fue notificado.",
            },
            trigger: { seconds: 1 },
        });
    };

    const handleCall = () => {
        // Verifica si el dispositivo puede realizar llamadas
        Linking.canOpenURL(`tel:${phoneNumber}`)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(`tel:${phoneNumber}`);
                } else {
                    Alert.alert('Error', 'No se puede realizar la llamada en este dispositivo');
                }
            })
            .catch((err) => console.error('An error occurred', err));
    };


    if (loading) {
        return <ActivityIndicator size="large" color={colors.primary} />;
    }
    return (
        <View style={styles.container}>

            {/* Logic for the button based on user type */}
            {userData ? (
                userData.tipousuario == "Comercio" ? (
                    <>
                    
                    <Text style={styles.userInfo}>
                        {user ? `Bienvenido, ${user.email}` : "Cargando..."}
                    </Text>

                    <Pressable
                        onPress={() => {
                            fetchComercioData(userData.userId); // Call the function to get commerce data
                            setModalVisible(true); // Open the modal
                        }} 
                        style={styles.commerceButton}
                    >
                        <Text style={styles.buttonText}>Solicita un Servicio</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            fetchComercioData(userData.userId); // Call the function to get commerce data
                            setModalVisible(true); // Open the modal
                        }} 
                        style={styles.commerceButton}
                    >
                        <Text style={styles.buttonText}>Ver Servicios</Text>
                    </Pressable>


                    </>
                ) : (
                    <Text style={styles.noDomiciliosText}></Text>
                )
            ) : (
                <Text>Cargando datos del usuario...</Text>
            )}

{userData ? (
                userData.tipousuario == "Domiciliario" ? (
                    <FlatList
                        data={domiciliosparaDomi}
                        keyExtractor={(item) => item.domicilioId} // Asegúrate de que 'domicilioId' sea único
                        renderItem={({ item }) => (
                            <View style={styles.domicilioCard}>
                                 <Text style={styles.cardTitle}>Comercio: {item.nombreComercio}</Text>
                                <Text style={styles.cardTitle}>Nombre cliente: {item.contacto}</Text>
                                <Text>Teléfono: {item.telefono}</Text>
                                <Text>Dirección Entrega: {item.direccionCliente}</Text>
                                <Text>Observacion: {item.direccion} </Text>
                                <Text>Dirección Recogida: {item.direccionComercio}</Text>
                                <Text>Estado: {item.estado}</Text>
                                <Text>fecha: {item.fecha}</Text>
                                <Pressable
                        onPress={() => {
                            actualizarEstadoDomicilio(item.domicilioId, 'asignado',userData.userId ); // Open the modal
                        }} 
                        style={styles.commerceButton}
                    >
                        <Text style={styles.buttonText}>Realizar Servicio</Text>
                    </Pressable>
                            </View>
                        )}
                    />
                ) : (
                    <Text style={styles.noDomiciliosText}></Text>
                )
            ) : (
                <Text>Cargando datos del usuario...</Text>
            )}  



            {/* Modal for the form */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{comercioData ? comercioData.razonSocial : 'Cargando Comercio...'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            value={formData.nombre}
                            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Teléfono"
                            value={formData.telefono}
                            onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Direccion Cliente"
                            value={formData.direccionCliente}
                            onChangeText={(text) => setFormData({ ...formData, direccionCliente: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Observacion"
                            value={formData.observacion}
                            onChangeText={(text) => setFormData({ ...formData, observacion: text })}
                        />
                        <Text style={styles.label}>Selecciona una Dirección de comercio:</Text>
                        <Picker
                            style={styles.picker}
                            selectedValue={selectedDireccion}
                            onValueChange={(itemValue) => setSelectedDireccion(itemValue)}
                        >
                            <Picker.Item label="Selecciona una dirección" value="" />
                            {direcciones.map((direccion, index) => (
                                <Picker.Item key={index} label={direccion} value={direccion} />
                            ))}
                        </Picker>
                        <Button title="Enviar" onPress={handleFormSubmit} />
                        <Button title="Cerrar" onPress={() => setModalVisible(false)} color="red" />
                    </View>
                </View>
            </Modal>


            
            {userData && userData.tipousuario === "Comercio" && (
                <FlatList
                    data={domicilios}
                    keyExtractor={(item) => item.domicilioId} // Asegúrate de que 'domicilioId' sea único
                    renderItem={({ item }) => (
                        <View style={styles.domicilioCard}>
                            <Text style={styles.cardTitle}>Comercio: {item.nombreComercio}</Text>
                            <Text style={styles.cardTitle}>Nombre cliente: {item.contacto}</Text>
                            <Text>Teléfono: {item.telefono}</Text>
                            <Text>Dirección Entrega: {item.direccionCliente} </Text>
                            <Text>Observacion: {item.direccion} </Text>
                            <Text>Dirección Recogida: {item.direccionComercio}</Text>
                            <Text>fecha: {item.fecha}</Text>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badge}>{item.estado}</Text>
                            </View>
                        </View>
                    )}
                />
                
            )}

                        <View style={styles.buttonContainer}>
                <Pressable style={styles.button} >
                    <FontAwesome name="home" size={24} color="white" />
                    <Text style={styles.buttonText}>Inicio</Text>
                </Pressable>
                <Pressable style={styles.button} >
                    <FontAwesome name="user" size={24} color="white" />
                    <Text style={styles.buttonText}>Perfil</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={Salir} >
                    <FontAwesome name="sign-out" size={24} color="white" />
                    <Text style={styles.buttonText}>Salir</Text>
                </Pressable>
                <Pressable
                onPress={() => navigation.navigate("Chat")}
                style={styles.button}
            >
                <Entypo name="chat" size={24} color={colors.lightGray} />
                <Text style={styles.buttonText}>Soporte</Text>
            </Pressable>
            </View>
        </View>
    );
};

export default Inicio;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: "#fff",
    },
    userInfo: {
        fontSize: 18,
        marginBottom: 20,
        color: colors.primary,
    },
    chatButton: {
        backgroundColor: colors.primary,
        height: 50,
        width: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: .9,
        shadowRadius: 8,
        marginRight: 20,
        marginBottom: 50,
    },
    commerceButton: {
        backgroundColor: colors.secondary, // Adjust color as per your palette
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
    noDomiciliosText: {
        fontSize: 16,
        color: colors.gray, // Adjust color as per your palette
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(72, 117, 134, 0.5)', // Dark background
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        width: '100%',
        borderRadius: 5,
    },
    label: {
        marginTop: 10,
        fontSize: 16,
    },
    picker: {
        height: 50,
        width: '100%',
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: '#fff', // White background for the Picker
    },
    domicilioCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3, // Para Android
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    badgeContainer: {
        marginTop: 10,
        padding: 5,
        borderRadius: 15,
        backgroundColor: colors.secondary, // Cambia según tu paleta
        alignSelf: 'flex-start',
    },
    badge: {
        color: '#fff',
        fontSize: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 20, // Espacio desde el fondo
        backgroundColor: colors.primary, // Color de fondo de la botonera
        width: "100%"
    },
    button: {
        alignItems: 'center',
        padding: 10,
    },
    buttonText: {
        color: 'white',
        marginTop: 5,
    },
    map: {
        width: '100%',
        height: '100%',
      },
});
