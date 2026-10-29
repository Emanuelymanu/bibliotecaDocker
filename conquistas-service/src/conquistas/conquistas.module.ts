import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminConquistasController } from './admin-conquistas.controller';
import { AdminConquistasService } from './admin-conquistas.service';
import { ConquistasController } from './conquistas.controller';
import { ConquistasService } from './conquistas.service';
import { ConquistaDoUsuario } from './entities/conquista-do-usuario.entity';
import { Conquista } from './entities/conquista.entity';
import { EstatisticasLeitorEntity } from './entities/estatisticas-leitor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conquista, ConquistaDoUsuario, EstatisticasLeitorEntity])],

  controllers: [AdminConquistasController, ConquistasController],
  providers: [ConquistasService, AdminConquistasService],
  exports: [ConquistasService],
})
export class ConquistasModule {}
