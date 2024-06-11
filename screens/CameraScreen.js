import { Entypo } from '@expo/vector-icons';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, View, StyleSheet, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import OpenAI from 'openai';
import * as Speech from 'expo-speech';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';


export const CameraScreen = () => {
    const [cameraRef, setCameraRef] = useState(null);
    const scaleValue = useRef(new Animated.Value(1)).current;
    const fadeOutValue = useRef(new Animated.Value(1)).current;
    const rotateValue = useRef(new Animated.Value(0)).current;
    const microphoneScale = useRef(new Animated.Value(1)).current;
    const [b64, setB64] = useState('');
    const [facing, setFacing] = useState('back');
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);

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

  useEffect(() => {
    animateMicrophone();
  }, []);

  const animateMicrophone = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(microphoneScale, {
          toValue: 1.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(microphoneScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const convertImageToBase64 = async (uri) => {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  };

  const takePicture = async () => {
      try {
        setLoading(true);
        const photo = await cameraRef.takePictureAsync();

        setCapturedPhoto(photo.uri); 
        const resizedImage = await resizeAndCompressImage(photo.uri);
        const imageUriBase64 = await convertImageToBase64(resizedImage.uri);
        setB64(imageUriBase64);

        const description = await describeImageWithOpenAI(imageUriBase64);
        setLoading(false);
        speakDescription(description);

      } catch (error) {
        console.error('Error in takePicture function:', error);
        setLoading(false);
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
            text: `What is in this image? Please describe me as i'm visually impaired person. Give me a short description.`,
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
  setSpeaking(true);
  startLoadingAnimation();
  Speech.speak(description, {
    onDone: () => {
      stopLoadingAnimation();
      setTimeout(() => {
        Animated.timing(fadeOutValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setCapturedPhoto(null)
          setSpeaking(false);
        });
      }, 1000); // Wait 1 second before fading out the image
    },
    onError: () => {
      setSpeaking(false);
      stopLoadingAnimation();
    },
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
  }

    return (
    <View style={styles.container}>
      {
        loading && (
          <View style={styles.overlay}>
            <LottieView
              source={require('../assets/animations/loading-lottie.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        )
      }
      {
        speaking && (
        <View style={styles.overlay}>
          <Animated.View style={{ transform: [{ scale: microphoneScale }] }}>
           <View style={{ backgroundColor: "#f57f51", borderRadius: 70 }}>
             <FontAwesome style={{ padding: 30, paddingHorizontal: 40 }} name="microphone" size={50} color="#fff" />
           </View>
          </Animated.View>
         </View>
        )
      }
      
      <CameraView style={styles.camera} facing={facing} ref={(ref) => setCameraRef(ref)}>
      {
      capturedPhoto ? <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} />
      : 
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
        }
      </CameraView>
    </View>
    )
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
    capturedImage: {
      flex: 1,
      width: '100%',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    lottie: {
      width: 500,
      height: 500,
    },
  });