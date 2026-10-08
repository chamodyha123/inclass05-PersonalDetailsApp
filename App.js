import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';

const POINTS_KEY = '@profile-details/points';
const PHOTO_URI_KEY = '@profile-details/photo-uri';
const PROFILE_PHOTO_NAME = 'profile-photo.jpg';

export default function App() {
  const [points, setPoints] = useState(0);
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const pointsRef = useRef(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [savedPoints, savedPhotoUri] = await Promise.all([
          AsyncStorage.getItem(POINTS_KEY),
          AsyncStorage.getItem(PHOTO_URI_KEY),
        ]);
        const parsedPoints = Number.parseInt(savedPoints, 10);

        if (Number.isFinite(parsedPoints) && parsedPoints >= 0) {
          pointsRef.current = parsedPoints;
          setPoints(parsedPoints);
        }

        if (savedPhotoUri) {
          const savedPhoto = new File(savedPhotoUri);
          if (savedPhoto.exists) {
            setProfileImageUri(savedPhotoUri);
          } else {
            await AsyncStorage.removeItem(PHOTO_URI_KEY);
          }
        }
      } catch (error) {
        Alert.alert(
          'Profile loading issue',
          'Saved profile details could not be loaded. You can continue using the app.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const addPoint = async () => {
    const nextPoints = pointsRef.current + 1;
    pointsRef.current = nextPoints;
    setPoints(nextPoints);

    try {
      await AsyncStorage.setItem(POINTS_KEY, String(nextPoints));
    } catch (error) {
      Alert.alert(
        'Points not saved',
        'The point was added for now, but it may not be available after restarting the app.'
      );
    }
  };

  const pickProfileImage = async () => {
    if (isPickingImage) return;

    try {
      setIsPickingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to choose a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const sourceFile = new File(result.assets[0].uri);
      const persistentFile = new File(Paths.document, PROFILE_PHOTO_NAME);

      if (persistentFile.exists) persistentFile.delete();

      await sourceFile.copy(persistentFile);
      await AsyncStorage.setItem(PHOTO_URI_KEY, persistentFile.uri);
      setProfileImageUri(persistentFile.uri);
    } catch (error) {
      Alert.alert(
        'Photo not saved',
        'We could not save that image. Please choose another photo and try again.'
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  const openEmail = async () => {
    const emailUrl = 'mailto:peshanchamoth759@gmail.com';

    try {
      if (await Linking.canOpenURL(emailUrl)) {
        await Linking.openURL(emailUrl);
      }
    } catch (error) {
      Alert.alert('Email unavailable', 'No email app is available on this device.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#000000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#000000" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose profile picture"
          disabled={isPickingImage}
          onPress={pickProfileImage}
          style={styles.profileImageButton}
        >
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              {isPickingImage ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Ionicons name="person" size={52} color="#1D1D1D" />
              )}
            </View>
          )}
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.details}>
          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>chamodyha peshan</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Email</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Email peshanchamoth759@gmail.com"
              onPress={openEmail}
              style={styles.iconValueRow}
            >
              <Ionicons name="mail" size={18} color="#000000" />
              <Text style={styles.emailValue}>peshanchamoth759@gmail.com</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Points</Text>
            <View style={styles.iconValueRow}>
              <Ionicons name="star" size={18} color="#000000" />
              <Text style={styles.value}>{points}</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add point"
        onPress={addPoint}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={31} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 24 },
  profileImageButton: {
    alignSelf: 'center',
    width: 104,
    height: 104,
    marginTop: 32,
    borderRadius: 52,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 30,
    backgroundColor: '#D0D0D0',
  },
  details: { paddingTop: 26 },
  section: { marginBottom: 27 },
  label: { marginBottom: 7, color: '#222222', fontSize: 15, fontWeight: '700' },
  value: { color: '#111111', fontSize: 16 },
  iconValueRow: { flexDirection: 'row', alignItems: 'center' },
  emailValue: {
    marginLeft: 8,
    color: '#111111',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#000000',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabPressed: { opacity: 0.78 },
});