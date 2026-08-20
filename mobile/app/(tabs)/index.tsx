import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native';
export default function HomeScreen() {
  const router = useRouter();
  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>📚 Minha Estante</Text>
      <Text style={styles.subtitle}>Bem-vindo ao seu app de leitura!</Text>
      <Button title="TESTE: ir pra Admin" onPress={() => router.push('/admin')} />
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});