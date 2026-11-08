import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import UserFormScreen from "../screens/users/UserFormScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={UserFormScreen}
        options={{
          headerShown: true,
          headerTitle: "Gusaba konti nshya",
          headerStyle: { backgroundColor: "#1b6e3c" },
          headerTintColor: "white",
        }}
      />
    </Stack.Navigator>
  );
}
