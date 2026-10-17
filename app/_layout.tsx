
import { Slot } from "expo-router";
import { View } from "react-native";
import Header from "../src/components/Header";
import "../global.css";

export default function RootLayout() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Header />
      <View className="flex-1 mt-24">
        <Slot />
      </View>
    </View>
  );
}
