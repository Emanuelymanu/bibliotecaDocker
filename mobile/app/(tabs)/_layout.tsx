import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Brand } from '@/constants/Brand';

export default function TabLayout() {
  const { usuario } = useAuth();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
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

    {usuario?.tipo_usuario === 'admin' && (
      <TouchableOpacity
        style={styles.botaoAdmin}
        onPress={() => router.push('/admin')}
        activeOpacity={0.85}
      >
        <Ionicons name="shield-checkmark" size={22} color="#fff" />
      </TouchableOpacity>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  botaoAdmin: {
    position: 'absolute',
    right: 16,
    bottom: 76,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});