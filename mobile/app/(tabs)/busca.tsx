import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buscarLivrosNaAPI, Livro } from '../../src/services/googleBooksSerice';
import { livrosService } from '../../src/services/livrosService';
import { leiturasService } from '../../src/services/leiturasService';
import { listaDesejosService } from '../../src/services/listaDesejosService';

export default function BuscaScreen() {
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [resultados, setResultados] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [ultimaBusca, setUltimaBusca] = useState<string>('');
  const [adicionando, setAdicionando] = useState<string | null>(null); // guarda o id_google do item em processamento

  const handleBuscar = async (): Promise<void> => {
    if (!termoBusca.trim()) {
      Alert.alert('Atenção', 'Digite um título, autor ou ISBN para buscar.');
      return;
    }

    setCarregando(true);
    setUltimaBusca(termoBusca);

    try {
      const livros = await buscarLivrosNaAPI(termoBusca);
      setResultados(livros);

      if (livros.length === 0) {
        Alert.alert('Nenhum livro encontrado', 'Tente buscar por outro termo.');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível buscar os livros. Tente novamente.');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };


  async function handleAdicionar(livro: Livro) {
    Alert.alert(livro.titulo, 'Onde você quer adicionar esse livro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Lista de Desejos', onPress: () => adicionarLivro(livro, 'wishlist') },
      { text: 'Minha Biblioteca', onPress: () => adicionarLivro(livro, 'biblioteca') },
    ]);
  }

  async function adicionarLivro(livro: Livro, destino: 'biblioteca' | 'wishlist') {
    setAdicionando(livro.id_google);
    try {
      const { id_livro } = await livrosService.cadastrarComGoogle({
        titulo: livro.titulo,
        subtitulo: livro.subtitulo,
        autores: livro.autores,
        ano_publicacao: livro.ano_publicacao,
        num_paginas: livro.num_paginas,
        generos: livro.generos,
        editora: livro.editora,
        capa: livro.capa || undefined,
        id_google: livro.id_google,
      });

      if (destino === 'wishlist') {
        await listaDesejosService.adicionar(id_livro);
        Alert.alert('Pronto!', 'Livro adicionado à sua lista de desejos.');
      } else {
   
        const leituras = await leiturasService.listar();
        const criada = leituras.find((l) => l.livro?.id_livro === id_livro);
        if (criada) {
          await leiturasService.atualizarStatus(criada.id_leitura, 'quero_ler');
        }
        Alert.alert('Pronto!', 'Livro adicionado à sua biblioteca.');
      }
    } catch (error: any) {
      const mensagem = error?.response?.data?.erro || error?.response?.data?.message;
      if (error?.response?.status === 409) {

        Alert.alert('Atenção', mensagem || 'Esse livro já está na sua estante.');
        console.warn('Livro já cadastrado:', mensagem);
      } else {
        Alert.alert('Erro', mensagem || 'Não foi possível adicionar o livro.');
        console.error(error);
      }
    } finally {
      setAdicionando(null);
    }
  }

  const renderItem = ({ item }: { item: Livro }) => (
    <TouchableOpacity style={styles.livroCard} onPress={() => console.log('Abrir detalhes do:', item.titulo)}>
      <Image
        source={{ uri: item.capa || 'https://via.placeholder.com/80x120/cccccc/666666?text=Sem+Capa' }}
        style={styles.capa}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.tituloLivro} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={styles.autores} numberOfLines={2}>
          {item.autores.join(', ')}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.paginas}>{item.num_paginas} páginas</Text>
          <TouchableOpacity
            style={styles.botaoAdicionar}
            onPress={() => handleAdicionar(item)}
            disabled={adicionando === item.id_google}
          >
            {adicionando === item.id_google ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.botaoAdicionarTexto}>+</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Buscar Livros</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={termoBusca}
          onChangeText={setTermoBusca}
          placeholder="Digite título, autor ou ISBN"
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={handleBuscar}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.botaoBuscar} onPress={handleBuscar} disabled={carregando}>
          {carregando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {ultimaBusca && !carregando && resultados.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>Nenhum livro encontrado</Text>
          <Text style={styles.emptyStateSubtext}>Tente buscar por outro termo</Text>
        </View>
      )}

      {carregando && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Buscando livros...</Text>
        </View>
      )}

      {!carregando && resultados.length > 0 && (
        <FlatList
          data={resultados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_google}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  botaoBuscar: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 56,
  },
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  livroCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  capa: {
    width: 70,
    height: 105,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  tituloLivro: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  autores: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paginas: {
    fontSize: 12,
    color: '#999',
  },
  botaoAdicionar: {
    backgroundColor: '#6200ee',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoAdicionarTexto: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});
