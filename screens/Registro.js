import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, Alert, Image, StatusBar, Picker, Dimensions } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid'; // Importar la función para generar GUID
import colors from "../colors";

const { width, height } = Dimensions.get('window'); // Obtener dimensiones de la pantalla

export default function Registro({ navigation }) {
    const [email, setEmail] = useState("");
    const [nombre, setNombre] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [userType, setUserType] = useState("Usuario"); // Valor por defecto
    const [status] = useState("Registrado"); // Campo oculto

    // Campos adicionales para Comercio
    const [razonSocial, setRazonSocial] = useState("");
    const [nit, setNit] = useState("");
    const [direcciones, setDirecciones] = useState([{ descripcion: "" }]); // Inicializar con un campo de dirección
    const [pagina, setPagina] = useState("");
    // Campos adicionales para Domiciliario
    const [formaDePago, setFormaDePago] = useState("Nequi");
    const [nombreBanco, setNombreBanco] = useState("");
    const [numeroCuenta, setNumeroCuenta] = useState("");
    const [tipoTransporte, setTipoTransporte] = useState("Moto");

    const EnvioRegistro = async () => {
        if (email !== "" && password !== "" && phone !== "" && nombre !== "") {
            // Validar que el teléfono contenga solo números
            if (!/^\d+$/.test(phone)) {
                Alert.alert("Error", "El número de teléfono debe ser numérico.");
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userId = uuidv4(); // Generar un GUID único para el usuario

                // Crear un documento en la colección 'usuarios'
                const userDoc = {
                    userId: userId,
                    email: email,
                    telefono: phone,
                    tipousuario: userType,
                    estado: status,
                    nombre: nombre
                };

                await addDoc(collection(database, 'usuarios'), userDoc);

                if (userType === "Comercio") {
                    const comercioId = uuidv4(); // Generar un GUID único para el comercio
                    const comercioDoc = {
                        comercioId: comercioId,
                        userId: userId,
                        razonSocial: razonSocial,
                        nit: nit,
                        pagina: pagina
                    };

                    await addDoc(collection(database, 'comercios'), comercioDoc);

                    // Guardar las direcciones en la colección 'direccionesComercio'
                    for (const direccion of direcciones) {
                        if (direccion.descripcion) {
                            const direccionComercioId = uuidv4(); // Generar un GUID único para la dirección
                            const direccionDoc = {
                                direccionComercioId: direccionComercioId,
                                comercioId: comercioId,
                                descripcion: direccion.descripcion,
                            };
                            await addDoc(collection(database, 'direccionesComercio'), direccionDoc);
                        }
                    }
                } else if (userType === "Domiciliario") {
                    const domiciliarioId = uuidv4(); // Generar un GUID único para el domiciliario
                    const domiciliarioDoc = {
                        domiciliarioId: domiciliarioId,
                        userId: userId,
                        formaDePago: formaDePago,
                        nombreBanco: formaDePago === "Banco" ? nombreBanco : "N/A",
                        numeroCuenta: numeroCuenta,
                        tipoTransporte: tipoTransporte,
                    };

                    await addDoc(collection(database, 'domiciliarios'), domiciliarioDoc);
                }

                console.log("Usuario registrado con éxito");
            } catch (err) {
                Alert.alert("Error en el registro", err.message);
            }
        } else {
            Alert.alert("Error", "Por favor, completa todos los campos.");
        }
    };

    const agregarDireccion = () => {
        setDirecciones([...direcciones, { descripcion: "" }]);
    };

    const actualizarDireccion = (index, descripcion) => {
        const nuevasDirecciones = [...direcciones];
        nuevasDirecciones[index].descripcion = descripcion;
        setDirecciones(nuevasDirecciones);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.whiteSheet} />
            <SafeAreaView style={styles.form}>
                <Text style={styles.title}>Registro</Text>
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
                <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    autoCapitalize="none"
                    keyboardType="text"
                    autoFocus={true}
                    value={nombre}
                    onChangeText={(text) => setNombre(text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Teléfono"
                    keyboardType="numeric"
                    value={phone}
                    onChangeText={(text) => setPhone(text)}
                />
                <Picker
                    selectedValue={userType}
                    style={styles.picker}
                    onValueChange={(itemValue) => {
                        setUserType(itemValue);
                        if (itemValue !== "Comercio") {
                            setRazonSocial("");
                            setNit("");
                            setDirecciones([{ descripcion: "" }]); // Reiniciar direcciones si no es comercio
                        }
                        if (itemValue !== "Domiciliario") {
                            setFormaDePago("Nequi");
                            setNombreBanco("");
                            setNumeroCuenta("");
                            setTipoTransporte("Moto");
                        }
                    }}
                >
                    <Picker.Item label="Usuario" value="Usuario" />
                    <Picker.Item label="Comercio" value="Comercio" />
                    <Picker.Item label="Domiciliario" value="Domiciliario" />
                </Picker>

                {userType === "Comercio" && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Razón Social"
                            value={razonSocial}
                            onChangeText={(text) => setRazonSocial(text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="NIT"
                            value={nit}
                            onChangeText={(text) => setNit(text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Pagina web"
                            value={pagina}
                            onChangeText={(text) => setPagina(text)}
                            
                        />
                                                <TextInput
                            style={styles.input}
                            placeholder="Whatsapp"
                            value={razonSocial}
                            onChangeText={(text) => setRazonSocial(text)}
                            
                        />
                        {direcciones.map((direccion, index) => (
                            <TextInput
                                key={index}
                                style={styles.input}
                                placeholder={`Dirección ${index + 1}`}
                                value={direccion.descripcion}
                                onChangeText={(text) => actualizarDireccion(index, text)}
                            />
                        ))}
                        <Pressable style={styles.button} onPress={agregarDireccion}>
                            <Text style={styles.buttonText}>+</Text>
                        </Pressable>

                        
                    </>
                )}

                {userType === "Domiciliario" && (
                    <>
                        <Picker
                            selectedValue={formaDePago}
                            style={styles.picker}
                            onValueChange={(itemValue) => {
                                setFormaDePago(itemValue);
                                if (itemValue === "Banco") {
                                    setNombreBanco("");
                                } else {
                                    setNombreBanco("N/A");
                                }
                            }}
                        >
                            <Picker.Item label="Nequi" value="Nequi" />
                            <Picker.Item label="Daviplata" value="Daviplata" />
                            <Picker.Item label="Banco" value="Banco" />
                        </Picker>
                        {formaDePago === "Banco" && (
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del Banco"
                                value={nombreBanco}
                                onChangeText={(text) => setNombreBanco(text)}
                            />
                        )}
                        <TextInput
                            style={styles.input}
                            placeholder="Número de Cuenta"
                            value={numeroCuenta}
                            onChangeText={(text) => setNumeroCuenta(text)}
                        />
                        <Picker
                            selectedValue={tipoTransporte}
                            style={styles.picker}
                            onValueChange={(itemValue) => setTipoTransporte(itemValue)}
                        >
                            <Picker.Item label="Moto" value="Moto" />
                            <Picker.Item label="Bici" value="Bici" />
                            <Picker.Item label="Carro" value="Carro" />
                            <Picker.Item label="Camion" value="Camion" />
                        </Picker>
                    </>
                )}

                <Pressable style={styles.button} onPress={EnvioRegistro}>
                    <Text style={styles.buttonText}>Registrarme</Text>
                </Pressable>
                <View style={{ marginTop: 20, flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: "gray", fontWeight: "600", fontSize: width * 0.035 }}>
                        Tienes Cuenta?,
                        <Pressable onPress={() => navigation.navigate("Login")}>
                            <Text style={{ color: colors.secondary, fontWeight: "600", fontSize: width * 0.035 }}>
                                Logearme
                            </Text>
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
        fontSize: width * 0.08, // Responsive font size
        fontWeight: 'bold',
        color: colors.primary,
        alignSelf: "center",
        paddingBottom: 24,
    },
    input: {
        backgroundColor: "#F6F7FB",
        height: height * 0.07, // Responsive height
        marginBottom: 20,
        fontSize: width * 0.04, // Responsive font size
        borderRadius: 10,
        padding: 12,
    },
    whiteSheet: {
        width: "100%",
        height: "100%",
        position: "absolute",
        bottom: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
    },
    form: {
        flex: 1,
        justifyContent: "center",
        marginHorizontal: 30,
    },
    button: {
        height: height * 0.07, // Responsive height
        width: "100%",
        backgroundColor: colors.primary,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
    },
    buttonText: {
        fontWeight: "bold",
        color: "#fff",
        fontSize: width * 0.045, // Responsive font size
    },
    picker: {
        height: height * 0.07, // Responsive height
        width: "100%",
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: "#F6F7FB",
    },
});
