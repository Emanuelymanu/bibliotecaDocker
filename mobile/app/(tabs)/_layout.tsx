// app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
            
          } else if (route.name === 'busca') {
            iconName = focused ? 'search' : 'search-outline';

          } else if (route.name === 'biblioteca') {
            iconName = focused ? 'library' : 'library-outline';

          } else if (route.name === 'leituras') {
            iconName = focused ? 'book' : 'book-outline';

          } else if (route.name === 'perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },

        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,

        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#ddd',
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início' }}
      />

      <Tabs.Screen
        name="busca"
        options={{ title: 'Buscar' }}
      />

      <Tabs.Screen
        name="biblioteca"
        options={{ title: 'Biblioteca' }}
      />

      <Tabs.Screen
        name="leituras"
        options={{ title: 'Leituras' }}
      />

      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil' }}
      />
    </Tabs>
  );
}