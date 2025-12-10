import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, TouchableOpacity } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AuthService from "@/services/auth.service";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserPhoto();
  }, []);

  const loadUserPhoto = () => {
    const userInfo = AuthService.getUserInfo();
    if (userInfo?.photoUrl) {
      setUserPhotoUrl(userInfo.photoUrl);
    }
  };

  const handleAvatarPress = () => {
    router.push("/profile");
  };

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={handleAvatarPress}
      style={{
        marginRight: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {userPhotoUrl ? (
        <Image
          source={{ uri: userPhotoUrl }}
          style={{ width: 36, height: 36 }}
        />
      ) : (
        <Ionicons name="person" size={20} color="#999" />
      )}
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerRight: renderHeaderRight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-batches"
        options={{
          title: "Batches",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="square.stack.3d.up.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
