import { Entypo } from '@expo/vector-icons';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Animated, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import OpenAI from 'openai';
import * as Speech from 'expo-speech';


export default function App() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const [b64, setB64] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const fadeInValue = useRef(new Animated.Value(0)).current;
  const [welcomeText, setWelcomeText] = useState(''); 
  const [finishedSpeaking, setFinishedSpeaking] = useState(false);
 const welcomeMessage = "Welcome to VisionEcho, where we empower vision through audio.";
  const tapMessage = "Tap anywhere to continue.";

  useEffect(() => {
    requestPermission();
    Animated.timing(fadeInValue, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(playWelcomeMessage, 1000);
    });
  }, []);

  const playWelcomeMessage = () => {
    let currentText = '';
    Speech.speak(welcomeMessage, {
      onDone: () => {
        setTimeout(() => {
          Speech.speak(tapMessage, {
            onDone: () => setFinishedSpeaking(true),
          });
        }, 1000); // Delay before the second part
      },
      onBoundary: ({ charIndex }) => {
        currentText = welcomeMessage.substring(0, charIndex);
        setWelcomeText(currentText);
      },
    });
  };

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

  if (showWelcome) {
    return (
      <Animated.View style={[styles.welcomeContainer, { opacity: fadeInValue }]} onTouchEnd={() => {
        if(finishedSpeaking){
          setShowWelcome(false)
        }
      }}>
        <View style={styles.welcomeAnimationContainer}>
        <Image
          source={require("./assets/logo-no-background.png")}
          style={{ borderRadius: 50, width: 300, height: 300 }}
        />
        </View>
        <Text style={styles.welcomeText}>Tap anywhere to continue</Text>
      </Animated.View>
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

        const resizedImage = await resizeAndCompressImage(photo.uri);
        const imageUriBase64 = await convertImageToBase64(resizedImage.uri);
        setB64(imageUriBase64);

        const description = await describeImageWithOpenAI(imageUriBase64);
        speakDescription(description);

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

  const result = await postData(url, params);

  const displayText = result.choices[0].message.content;
  
  return displayText;
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

const startLoadingAnimation = () => {
  Animated.loop(
    Animated.timing(rotateValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    })
  ).start();
};

const stopLoadingAnimation = () => {
  rotateValue.setValue(0);
};

const speakDescription = (description) => {
  startLoadingAnimation();
  Speech.speak(description, {
    onDone: stopLoadingAnimation,
    onError: stopLoadingAnimation,
  });
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
          <Animated.View
              style={{
                transform: [
                  { scale: scaleValue },
                  {
                    rotate: rotateValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >              
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
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE9E4',
  },
  welcomeAnimationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  welcomeAnimation: {
    width: 300,
    height: 400,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    color: '#a61613',
    marginTop: 50
  }
});