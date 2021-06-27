// @refresh reset
import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect, useCallback }from 'react';
import { StyleSheet, Text, View, TextInput, Button} from 'react-native';
import { firebaseConfig } from "./firebaseConfig";
import { GiftedChat } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-community/async-storage';
import firebase from "firebase/app";
//import * as firebase from 'firebase';
import 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([])
  
 if (firebase.apps.length === 0) {
   firebase.initializeApp(firebaseConfig)
 }

 const db = firebase.firestore();
 const chatsRef = db.collection('chats');

  useEffect(()=>{
    readUser()
    const unsubscribe = chatsRef.onSnapshot((querySnapshot) => {
      const messagesFirestore = querySnapshot.docChanges()
                    .filter(({type})=> type==='added')
                    .map(({doc})=> {
                      const message = doc.data()
                      return {...message, createdAt: message.createdAt.toDate() }
                    })
                    .sort((a,b)=> b.createdAt.getTime()- a.createdAt.getTime())
      appendMessages(messagesFirestore)
    })
    return () => unsubscribe()
  }, [])

  const handleConfirm = async () =>{
    const _id = Math.random().toString(36).substring(7);
    const user = {_id, name};
    try{
        await AsyncStorage.setItem('user', JSON.stringify(user)) 
    } catch (err) {
      console.log("AsyncStorage is not working")
    }
    setUser(user)
  }

  const readUser = async ()=>{
    try{
        const user = await AsyncStorage.getItem('user');
    }catch(err) {
        const user = null
    }
    if(user) {
      setUser(JSON.parse(user));
    }
  }
  
  const handleSend= async(message) => {
    const writes = message.map((m)=> chatsRef.add(m))
    try {
      await Promise.all(writes);
    }
    catch(err) {
      alert(err);
    }
  }

  const appendMessages = useCallback((messages) =>{
    setMessages((preMessages) => GiftedChat.append(preMessages, messages))
  }, [messages])

  return user && user.name.length!=0? (
    <>
      <View style={styles.container}>
        <Text style={styles.text}>hello {user.name} </Text>
        <Button style={styles.button}
          title="back"
          onPress= {()=>setUser(null)}/>
        <StatusBar style="auto" />
      </View>
      <GiftedChat messages= {messages} user={user} onSend={handleSend}/>
    </>
  ): (
    <View style={styles.container}>
      <Text>please enter your name</Text>
      <TextInput style={styles.textinput}
        stype ={{height:40}} 
        placeholder="please enter your name" 
        value = {name}
        onChangeText= {text => setName(text)}
        defaultValue = ""/>  
      <Button styple={styles.button}
        title = "confirm"
        onPress = {handleConfirm}
        />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  button:{
    padding: 16,
  },
  textinput:{
    padding:16,
    marginBottom:24,
  },
  text:{
    marginBottom:24,
  }
});
