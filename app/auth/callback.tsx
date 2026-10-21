
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState('Callback route opened. Checking incoming URL...');
  const handled = useRef(false);

  useEffect(() => {
    let active = true;

    async function handleUrl(url: string) {
      if (!active || handled.current) return;

      handled.current = true;
      setMessage('Processing confirmation link...');

      try {
        console.log('Auth callback received a URL');

        const parsed = ExpoLinking.parse(url);
        const params = parsed.queryParams ?? {};
        const hash = url.includes('#') ? url.split('#')[1] : '';
        const fragment = new URLSearchParams(hash);

        const errorDescription =
          params.error_description ??
          params.error ??
          fragment.get('error_description') ??
          fragment.get('error');

        if (errorDescription) {
          throw new Error(String(errorDescription));
        }

        const code = params.code;

        if (typeof code === 'string') {
          setMessage('Verifying confirmation...');
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const tokenHash = params.token_hash;
          const type = params.type;

          if (
            typeof tokenHash === 'string' &&
            typeof type === 'string'
          ) {
            setMessage('Verifying confirmation...');

            const allowedTypes = [
              'signup',
              'email',
              'magiclink',
              'recovery',
              'invite',
              'email_change',
            ] as const;

            if (
              !allowedTypes.includes(
                type as (typeof allowedTypes)[number]
              )
            ) {
              throw new Error('Unsupported confirmation link type.');
            }

            const { error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as (typeof allowedTypes)[number],
            });

            if (error) throw error;
          } else {
            const accessToken = fragment.get('access_token');
            const refreshToken = fragment.get('refresh_token');

            if (accessToken && refreshToken) {
              setMessage('Finishing sign-in...');

              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) throw error;
            }
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session) {
          throw new Error(
            'No session was created. Return to Sign In and try signing in with your confirmed account.'
          );
        }

        if (active) router.replace('/');
      } catch (error) {
        console.error(
          'Auth callback failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );

        if (!active) return;

        setMessage('Confirmation failed.');

        Alert.alert(
          'Email confirmation',
          error instanceof Error
            ? error.message
            : 'Unable to confirm your account.'
        );

        router.replace('/auth');
      }
    }

    void Linking.getInitialURL().then((url) => {
      console.log('CALLBACK INITIAL URL:', url);
    });

    // Listen first so a URL event cannot be missed during startup.
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    void Linking.getInitialURL()
      .then((url) => {
        if (url) void handleUrl(url);
      })
      .catch((error) => {
        console.error('Unable to read initial URL:', error);
        if (active) setMessage('Unable to read confirmation link.');
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text className="mt-4 text-gray-700 dark:text-gray-200">
        {message}
      </Text>
    </View>
  );
}
