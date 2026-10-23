
import { View, Text, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  onOpenCreate?: () => void;
}

export default function Header({ onOpenCreate }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={80}
      tint="light"
      style={{ paddingTop: insets.top }}
      className="absolute top-0 left-0 right-0 z-40 border-b border-gray-200 bg-white/80 dark:border-gray-700 dark:bg-gray-900/80"
    >
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <Text className="text-xl font-bold tracking-tighter text-indigo-600">
          brackets
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Create a bracket"
          className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 dark:border-indigo-800 dark:bg-indigo-950"
          onPress={onOpenCreate}
        >
          <Text className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {"{  }"}
          </Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}
