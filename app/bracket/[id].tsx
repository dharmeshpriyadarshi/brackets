
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

type BracketSpace = {
  id: string;
  bracket_id: string;
  media_type: "text" | "image" | "audio" | "video" | "link";
  content: string | null;
  sequence_order: number;
};

type Bracket = {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  is_chat: boolean;
  is_public: boolean;
  bracket_spaces: BracketSpace[];
};

export default function BracketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBracket() {
      setLoading(true);
      setErrorMessage(null);

      try {
        if (!id || Array.isArray(id)) {
          throw new Error("This bracket link is invalid.");
        }

        const { data, error } = await supabase
          .from("brackets")
          .select("*, bracket_spaces (*)")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("This bracket could not be found or is unavailable.");
        }

        if (!data.is_public) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user?.id !== data.creator_id) {
            throw new Error("This bracket is private or unavailable.");
          }
        }

        if (active) {
          setBracket(data as Bracket);
        }
      } catch (error: unknown) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load this bracket."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBracket();

    return () => {
      active = false;
    };
  }, [id]);

  const spaces = [...(bracket?.bracket_spaces ?? [])].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );

  return (
    <View className="flex-1 bg-gray-50 px-4 dark:bg-gray-900">
      <Stack.Screen options={{ title: bracket?.name ?? "Bracket" }} />

      <Pressable
        onPress={() => router.back()}
        className="mb-4 mt-2 self-start rounded-xl bg-gray-200 px-4 py-2 dark:bg-gray-800"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text className="font-medium text-gray-900 dark:text-white">
          ← Back
        </Text>
      </Pressable>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-3 text-gray-600 dark:text-gray-300">
            Loading bracket...
          </Text>
        </View>
      ) : errorMessage ? (
        <View className="rounded-2xl bg-white p-5 dark:bg-gray-800">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Bracket unavailable
          </Text>
          <Text className="mt-2 text-gray-600 dark:text-gray-300">
            {errorMessage}
          </Text>
        </View>
      ) : bracket ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <Text className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            {bracket.name}
          </Text>

          {spaces.length === 0 ? (
            <Text className="text-gray-600 dark:text-gray-300">
              This bracket has no spaces yet.
            </Text>
          ) : (
            spaces.map((space, index) => (
              <View key={space.id} className="flex-row">
                <View className="mr-3 items-center">
                  <View className="h-3 w-3 rounded-full bg-indigo-500" />
                  {index < spaces.length - 1 && (
                    <View className="my-1 w-0.5 flex-1 bg-gray-300 dark:bg-gray-700" />
                  )}
                </View>

                <View className="mb-4 min-h-16 flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <Text className="mb-2 text-xs font-medium uppercase text-indigo-600 dark:text-indigo-300">
                    {space.media_type}
                  </Text>
                  <Text className="text-base text-gray-900 dark:text-white">
                    {space.content || "No text content"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}
