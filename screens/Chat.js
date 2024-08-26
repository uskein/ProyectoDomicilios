import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Pressable } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { collection, addDoc, orderBy, query, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, database } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const navigation = useNavigation();

    const Salir = () => {
        signOut(auth).catch(error => console.log(error));
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable style={{ marginRight: 10 }} onPress={Salir}>
                   Cerrar <AntDesign name="logout" size={24} style={{ color: 'orange', marginRight: 10 }} />
                </Pressable>
            )
        });
    }, [navigation]);

    useLayoutEffect(() => {
        const coleccionReferencia = collection(database, 'chats');
        const q = query(coleccionReferencia, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, snapshot => {
            console.log("snapshot");
            setMessages(
                snapshot.docs.map(doc => ({
                    _id: doc.id,
                    createdAt: doc.data().createdAt.toDate(),
                    text: doc.data().text,
                    user: doc.data().user
                }))
            );
        });
        return () => unsubscribe();
    }, []);

    const onSend = useCallback((messages = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));

        const { _id, createdAt, text, user } = messages[0];
        addDoc(collection(database, 'chats'), {
            _id,
            createdAt,
            text,
            user
        });
    }, []);

    return (
        <>
        <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages)}
            user={{
                _id: auth?.currentUser?.email,
                avatar: 'https://i.pravatar.cc/300' // Corregido el enlace del avatar
            }}
            messagesContainerStyle={{
                backgroundColor: '#fff'
            }}
        />
        </>
    );
}
