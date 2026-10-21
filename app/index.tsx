
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        Alert.alert("Session error", error.message);
      }

      setEmail(data.session?.user.email ?? null);
      setCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    setSigningOut(false);

    if (error) {
      Alert.alert("Sign out failed", error.message);
      return;
    }

    router.replace("/auth");
  }

  if (checkingSession) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Checking your session...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-gray-900">
      <Text className="mb-3 text-3xl font-bold text-indigo-600">
        Brackets
      </Text>

      {email ? (
        <>
          <Text className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            You're signed in
          </Text>

          <Text className="mb-6 text-center text-gray-600 dark:text-gray-300">
            {email}
          </Text>

          <TouchableOpacity
            className="rounded-full bg-red-600 px-6 py-3"
            onPress={handleSignOut}
            disabled={signingOut}
          >
            <Text className="font-bold text-white">
              {signingOut ? "Signing out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="mb-6 text-gray-600 dark:text-gray-300">
            Sign in to continue.
          </Text>

          <TouchableOpacity
            className="rounded-full bg-indigo-600 px-6 py-3"
            onPress={() => router.push("/auth")}
          >
            <Text className="font-bold text-white">Go to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
