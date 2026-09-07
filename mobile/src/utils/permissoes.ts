import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function solicitarPermissaoGaleria(): Promise<boolean> {
    return new Promise((resolve) => {
        Alert.alert(
            'Acessar galeria',
            'Pra escolher uma capa, o app precisa acessar as fotos do seu aparelho.',
            [
                { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                {
                    text: 'Permitir',
                    onPress: async () => {
                        const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permissao.granted) {
                            Alert.alert(
                                'Permissão negada',
                                'Você pode habilitar o acesso às fotos depois, nas configurações do aparelho.'
                            );
                        }
                        resolve(permissao.granted);
                    },
                },
            ]
        );
    });
}
