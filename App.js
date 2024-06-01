import { Entypo } from '@expo/vector-icons';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import OpenAI from 'openai';


export default function App() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const scaleValue = useRef (new Animated.Value(1)).current;
  const [b64, setB64] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    requestPermission();
    console.log("EVEGO", process.env.EXPO_PUBLIC_OPENAI_API_KEY)
  }, []);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const resizeAndCompressImage = async (uri) => {
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024, height: 768 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
  };

  const convertImageToBase64 = async (uri) => {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  };


  const takePicture = async () => {
      try {
        const photo = await cameraRef.takePictureAsync();
        console.log(`Photo URI: ${photo.uri}`);

        const resizedImage = await resizeAndCompressImage(photo.uri);
        // console.log("resizedImage", resizedImage)
        const imageUriBase64 = await convertImageToBase64(resizedImage.uri);
        // console.log("imageUriBase64", imageUriBase64)
        setB64(imageUriBase64);

        // Send imageUriBase64 to OpenAI API or process as needed
        const description = await describeImageWithOpenAI(imageUriBase64);
        setDescription(`Description: ${description}`);

      } catch (error) {
        console.error('Error in takePicture function:', error);
      }
  };

const describeImageWithOpenAI = async (base64Image) => {
  const params = {
    model: 'gpt-4-turbo',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `What is in this image? Please describe me as i'm visually impaired person.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  };

  const url = 'https://api.openai.com/v1/chat/completions';
  setDescription('Sending request to OpenAI...');
  const result = await postData(url, params);

  const displayText = result.choices[0].message.content;
  console.log("RESULT", result.choices[0].message)
  setDescription(displayText)
}

const postData = async (url, data) => {
  const response = await fetch(url, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
    },
    body: JSON.stringify(data), 
  });

  return await response.json(); 
};

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={(ref) => setCameraRef(ref)}>
      <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              animateButton();
              takePicture();
            }}
          >
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
              <Entypo name="eye" size={64} color="white" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    padding: 15,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});