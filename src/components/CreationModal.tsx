
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { supabase } from "../lib/supabase";

interface CreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreationModal({
  visible,
  onClose,
  onSuccess,
}: CreationModalProps) {
  const [bracketName, setBracketName] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const braceProgress = useSharedValue(0);
  const formProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      braceProgress.value = 0;
      formProgress.value = 0;

      braceProgress.value = withSpring(1, {
  damping: 14,
  stiffness: 55,
  mass: 1.2,
});
      formProgress.value = withTiming(1, {
  duration: 750,
  easing: Easing.out(Easing.cubic),
});
    } else {
      braceProgress.value = 0;
      formProgress.value = 0;
    }
  }, [visible, braceProgress, formProgress]);

  const leftBraceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -12 * braceProgress.value },
      { scale: 0.9 + 0.1 * braceProgress.value },
    ],
    opacity: 0.6 + 0.4 * braceProgress.value,
  }));

  const rightBraceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 12 * braceProgress.value },
      { scale: 0.9 + 0.1 * braceProgress.value },
    ],
    opacity: 0.6 + 0.4 * braceProgress.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formProgress.value,
    transform: [{ translateY: 35 * (1 - formProgress.value) }],
  }));

  function resetForm() {
    setBracketName("");
    setContent("");
    setIsPublic(false);
  }

  function closeModal() {
    if (loading) return;
    resetForm();
    onClose();
  }

  async function handleCreateBracket() {
    if (!bracketName.trim()) {
      Alert.alert("Missing name", "Give your bracket a name.");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Missing content", "Add your first text space.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Please sign in before creating a bracket.");
      }

      const { data: bracket, error: bracketError } = await supabase
        .from("brackets")
        .insert({
          name: bracketName.trim(),
          creator_id: user.id,
          is_chat: false,
          is_public: isPublic,
        })
        .select("id")
        .single();

      if (bracketError) throw bracketError;

      const { error: spaceError } = await supabase
        .from("bracket_spaces")
        .insert({
          bracket_id: bracket.id,
          creator_id: user.id,
          media_type: "text",
          content: content.trim(),
          sequence_order: 1,
        });

      if (spaceError) {
        const { error: cleanupError } = await supabase
          .from("brackets")
          .delete()
          .eq("id", bracket.id);

        if (cleanupError) {
          console.error(
            "Bracket cleanup failed:",
            cleanupError.message,
          );
        }

        throw spaceError;
      }

      const savedName = bracketName.trim();
      const savedVisibility = isPublic ? "public" : "private";

      resetForm();
      onClose();
      onSuccess?.();

      Alert.alert(
        "Bracket created",
        `Your {${savedName}} bracket is saved as ${savedVisibility}.`,
      );
    } catch (error) {
      console.error("Bracket creation failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "message" in error
            ? String(error.message)
            : "Please try again.";

      Alert.alert("Couldn't create bracket", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-white dark:bg-gray-900"
      >
        <View className="flex-row items-center justify-between border-b border-gray-200 px-5 pb-4 pt-14 dark:border-gray-800">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Create a bracket
          </Text>

          <TouchableOpacity
            onPress={closeModal}
            disabled={loading}
            accessibilityLabel="Close creation modal"
            className="rounded-full bg-gray-100 p-2 dark:bg-gray-800"
          >
            <Text className="text-2xl font-bold text-gray-500">×</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[{ flex: 1 }, formStyle]}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              padding: 24,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="mb-2 text-xs font-semibold tracking-widest text-gray-500">
              BRACKET NAME
            </Text>

            <View className="mb-7 flex-row items-center rounded-2xl border border-indigo-300 bg-gray-50 px-4 dark:border-indigo-900 dark:bg-gray-800">
              <Animated.Text
                style={leftBraceStyle}
                className="mr-2 text-2xl font-bold text-indigo-600"
              >
                {"{"}
              </Animated.Text>

              <TextInput
                className="flex-1 py-4 text-base font-semibold text-gray-900 dark:text-white"
                placeholder="e.g. books worth reading"
                placeholderTextColor="#9CA3AF"
                value={bracketName}
                onChangeText={setBracketName}
                maxLength={100}
                editable={!loading}
                returnKeyType="next"
              />

              <Animated.Text
                style={rightBraceStyle}
                className="ml-2 text-2xl font-bold text-indigo-600"
              >
                {"}"}
              </Animated.Text>
            </View>

            <Text className="mb-2 text-xs font-semibold tracking-widest text-gray-500">
              FIRST SPACE
            </Text>

            <TextInput
              className="mb-7 min-h-36 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Write your first thought, recommendation, or note..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
              editable={!loading}
              maxLength={10000}
            />

            <Text className="mb-3 text-xs font-semibold tracking-widest text-gray-500">
              WHO CAN SEE THIS BRACKET?
            </Text>

            <View className="mb-8 flex-row gap-3">
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: !isPublic }}
                onPress={() => setIsPublic(false)}
                disabled={loading}
                className={`flex-1 rounded-2xl border p-4 ${
                  !isPublic
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <Text className="mb-1 text-base font-bold text-gray-900 dark:text-white">
                  Private
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Only you can see it.
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isPublic }}
                onPress={() => setIsPublic(true)}
                disabled={loading}
                className={`flex-1 rounded-2xl border p-4 ${
                  isPublic
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <Text className="mb-1 text-base font-bold text-gray-900 dark:text-white">
                  Public
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Discoverable by everyone.
                </Text>
              </Pressable>
            </View>

            <TouchableOpacity
              onPress={handleCreateBracket}
              disabled={loading}
              className="min-h-14 flex-row items-center justify-center rounded-2xl bg-indigo-600 px-5 py-4"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-xl font-bold text-white">+</Text>
                  <Text className="ml-2 text-base font-bold text-white">
                    Publish Bracket
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
