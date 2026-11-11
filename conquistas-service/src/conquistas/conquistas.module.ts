import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminConquistasController } from './admin-conquistas.controller';
import { AdminConquistasService } from './admin-conquistas.service';
import { CacheCatalogoService } from './cache-catalogo.service';
import { ConquistasController } from './conquistas.controller';
import { ConquistasService } from './conquistas.service';
import { ConquistaDoUsuario } from './entities/conquista-do-usuario.entity';
import { Conquista } from './entities/conquista.entity';
import { EstatisticasLeitorEntity } from './entities/estatisticas-leitor.entity';
import { EstatisticasEventosController } from './eventos/estatisticas-eventos.controller';
import { EstatisticasPendentesService } from './eventos/estatisticas-pendentes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conquista, ConquistaDoUsuario, EstatisticasLeitorEntity])],

  controllers: [AdminConquistasController, ConquistasController, EstatisticasEventosController],
  providers: [ConquistasService, AdminConquistasService, CacheCatalogoService, EstatisticasPendentesService],
  exports: [ConquistasService, CacheCatalogoService],
})
export class ConquistasModule {}