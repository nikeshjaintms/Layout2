import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectGalleryDto } from './create-project-gallery.dto';

export class UpdateProjectGalleryDto extends PartialType(CreateProjectGalleryDto) {}
