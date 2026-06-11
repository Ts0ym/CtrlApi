import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ImportProjectsBackupDto } from './dto/import-projects-backup.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Patch('reorder')
  @UseGuards(AdminAuthGuard)
  reorder(@Body() reorderProjectsDto: ReorderProjectsDto) {
    return this.projectsService.reorder(reorderProjectsDto.ids);
  }

  @Get('backup')
  @UseGuards(AdminAuthGuard)
  createBackup() {
    return this.projectsService.createJsonBackup();
  }

  @Post('backup/import')
  @UseGuards(AdminAuthGuard)
  importBackup(@Body() importProjectsBackupDto: ImportProjectsBackupDto) {
    return this.projectsService.importJsonBackup(importProjectsBackupDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }
}
