import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Always navigate to splash screen which will handle auth routing
    // Do this immediately without checking auth state since providers aren't ready yet
    const timer = setTimeout(() => {
      router.replace('/splash');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Return null while redirecting
  return null;
}
