import { Module } from '@nestjs/common';
import { ProjectGalleryService } from './project-gallery.service';
import { ProjectGalleryController } from './project-gallery.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectGalleryController],
  providers: [ProjectGalleryService],
})
export class ProjectGalleryModule {}
