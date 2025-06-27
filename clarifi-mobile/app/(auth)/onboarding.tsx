import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
// import { commonStyles } from '../../constants/CommonStyles'; // Temporarily disabled - causes spacing error during early loading

const OnboardingEntryScreen = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the first actual step of the onboarding process
    router.replace('/(auth)/biometric-setup');
  }, [router]);

  // Optional: Render a loading indicator while redirecting
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FAFBFD',
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <LoadingSpinner />
    </View>
  );
};

export default OnboardingEntryScreen;
