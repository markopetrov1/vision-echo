import { Entypo } from '@expo/vector-icons';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Animated, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import OpenAI from 'openai';
import * as Speech from 'expo-speech';
import { CameraScreen } from './screens/CameraScreen';
import { IntroScreen } from './screens/IntroScreen';


export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showWelcome, setShowWelcome] = useState(true);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Allow" />
      </View>
    );
  }

  return (
    showWelcome ? <IntroScreen requestPermission={requestPermission} setShowWelcome={setShowWelcome}/> : <CameraScreen/>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});