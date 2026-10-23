
import { useState } from "react";
import { Slot } from "expo-router";
import { View } from "react-native";
import Header from "../src/components/Header";
import CreationModal from "../src/components/CreationModal";
import "../global.css";

export default function RootLayout() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Header onOpenCreate={() => setModalVisible(true)} />

      <View className="mt-24 flex-1">
        <Slot />
      </View>

      <CreationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
