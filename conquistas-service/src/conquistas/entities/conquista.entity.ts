import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TIPOS_CONQUISTA, TipoConquista } from '../conquistas.tipos';
import { ConquistaDoUsuario } from './conquista-do-usuario.entity';

@Entity({ name: 'conquistas' })
export class Conquista {
  @PrimaryGeneratedColumn({ name: 'id_conquista', type: 'int' })
  id_conquista: number;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icone: string | null;

 
  @Column({ type: 'varchar', length: 255, nullable: true })
  criterio: string | null;

  @Column({ type: 'enum', enum: TIPOS_CONQUISTA, default: 'MANUAL' })
  tipo: TipoConquista;

  @Column({ type: 'int', default: 1 })
  valor_alvo: number;

  @Column({ type: 'int', nullable: true })
  id_genero: number | null;

  @OneToMany(() => ConquistaDoUsuario, (desbloqueio) => desbloqueio.conquista)
  desbloqueios: ConquistaDoUsuario[];
}