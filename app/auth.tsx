import * as ExpoLinking from 'expo-linking';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  console.log(
    'Auth callback URL:',
    ExpoLinking.createURL('auth/callback')
  );
  
  async function signInWithEmail() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
      } else {
        router.replace('/');
      }
    } catch {
      Alert.alert('Sign In Error', 'Unable to complete sign in. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const redirectTo = ExpoLinking.createURL('auth/callback');

const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {	
    emailRedirectTo: redirectTo,
  },
});

      if (error) {
        Alert.alert('Sign Up Error', error.message);
      } else if (data.session) {
        Alert.alert('Account created', 'Your account is ready.');
        router.replace('/');
      } else {
        Alert.alert(
          'Check your email',
          'Your account request was received. Follow the confirmation link if email verification is required.'
        );
      }
    } catch {
      Alert.alert('Sign Up Error', 'Unable to create your account. Try again.');
    } finally {
      setLoading(false);
    }
  }

  
  async function resendConfirmationEmail() {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email address you used to sign up.');
      return;
    }

    setLoading(true);

    try {
      const redirectTo = ExpoLinking.createURL('auth/callback');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        Alert.alert('Could not resend email', error.message);
      } else {
        Alert.alert(
          'Request submitted',
          'If this account is awaiting confirmation, Supabase should send a new confirmation email. Check your inbox and spam folder.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Resend failed',
        error instanceof Error ? error.message : 'Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-8">
          <Text className="mb-3 text-center text-4xl font-bold tracking-tighter text-indigo-600">
            brackets
          </Text>

          <Text className="mb-8 text-center text-base text-gray-500 dark:text-gray-400">
            Sign in or create your account
          </Text>

          <View className="gap-4">
            <TextInput
              className="w-full rounded-xl border border-gray-200 bg-gray-100 p-4 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Email address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <TextInput
              className="w-full rounded-xl border border-gray-200 bg-gray-100 p-4 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
            />

            {loading ? (
              <ActivityIndicator size="large" color="#4F46E5" />
            ) : (
              <>
                <TouchableOpacity
                  className="w-full items-center rounded-xl bg-indigo-600 p-4"
                  onPress={signInWithEmail}
                >
                  <Text className="text-lg font-bold text-white">Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="w-full items-center rounded-xl border border-indigo-600 bg-transparent p-4"
                  onPress={signUpWithEmail}
                >
                  <Text className="text-lg font-bold text-indigo-600">
                    Create Account
                  </Text>
                </TouchableOpacity>

                
  <TouchableOpacity
    className="w-full items-center rounded-xl p-3"
    onPress={resendConfirmationEmail}
    disabled={loading}
  >
    <Text className="font-semibold text-indigo-600">
      Resend confirmation email
    </Text>
  </TouchableOpacity>

              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}