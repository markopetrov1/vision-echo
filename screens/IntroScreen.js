import { useEffect, useRef, useState } from 'react';
import { Animated, Button, Image, Text, View, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';

export const IntroScreen = ({ setShowWelcome, requestPermission }) => {
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
    return (
        <Animated.View style={[styles.welcomeContainer, { opacity: fadeInValue }]} onTouchEnd={() => {
          if(finishedSpeaking){
             Animated.timing(fadeInValue, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }).start(() => setShowWelcome(false));
          }
        }}>
          <View style={styles.welcomeAnimationContainer}>
          <Image
            source={require("../assets/logo-no-background.png")}
            style={{ borderRadius: 50, width: 300, height: 300 }}
          />
          </View>
          <Text style={styles.welcomeText}>Tap anywhere to continue</Text>
        </Animated.View>
      );
}


const styles = StyleSheet.create({
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