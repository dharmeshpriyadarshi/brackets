
import { View, Text, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={80}
      tint="light"
      style={{ paddingTop: insets.top }}
      className="absolute top-0 left-0 right-0 z-40 border-b border-gray-200 dark:border-gray-700 dark:bg-gray-900/80 bg-white/80"
    >
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <Text className="text-xl font-bold tracking-tighter text-indigo-600">
          brackets
        </Text>

        <TouchableOpacity
          className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
          onPress={() =>
            console.log("{} pressed - slide animation coming soon")
          }
        >
          <Text className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {"{  }"}
          </Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}
