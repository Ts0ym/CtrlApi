import { rmSync } from 'fs';
import { Project } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { resolve, sep } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ImportProjectsBackupDto } from './dto/import-projects-backup.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const MANAGED_PREVIEW_PREFIX = '/uploads/project-previews/';
const MANAGED_PREVIEW_ROOT = resolve(process.cwd(), 'uploads', 'project-previews');

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProjectDto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async createJsonBackup(): Promise<{
    type: 'ctrl-landing-projects-backup';
    version: 1;
    exportedAt: string;
    projects: Project[];
  }> {
    const projects = await this.findAll();

    return {
      type: 'ctrl-landing-projects-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
    };
  }

  async importJsonBackup(
    backupDto: ImportProjectsBackupDto,
  ): Promise<{ imported: number; importedProjects: Project[]; projects: Project[] }> {
    if (
      backupDto.type !== 'ctrl-landing-projects-backup'
      || backupDto.version !== 1
    ) {
      throw new BadRequestException('Unsupported projects backup file');
    }

    if (backupDto.projects.length === 0) {
      return {
        imported: 0,
        importedProjects: [],
        projects: await this.findAll(),
      };
    }

    const lastProject = await this.prisma.project.findFirst({
      orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
      select: { sortOrder: true },
    });
    const startSortOrder = (lastProject?.sortOrder ?? -1) + 1;

    const importedProjects = await this.prisma.$transaction(
      backupDto.projects.map((project, index) =>
        this.prisma.project.create({
          data: {
            sortOrder: startSortOrder + index,
            date: project.date,
            title: project.title,
            imageSrc: project.imageSrc,
            videoEmbedCode: project.videoEmbedCode,
            description: project.description,
          },
        }),
      ),
    );

    return {
      imported: backupDto.projects.length,
      importedProjects,
      projects: await this.findAll(),
    };
  }

  async reorder(ids: number[]): Promise<Project[]> {
    const totalProjects = await this.prisma.project.count();

    if (ids.length !== totalProjects) {
      throw new NotFoundException('Reorder request must include all projects');
    }

    const existingProjects = await this.prisma.project.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingProjects.length !== ids.length) {
      throw new NotFoundException('One or more projects were not found');
    }

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.project.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findAll();
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const existingProject = await this.findOne(id);

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });

    if (
      updateProjectDto.imageSrc !== undefined
      && existingProject.imageSrc !== updatedProject.imageSrc
    ) {
      this.deleteManagedPreviewFile(existingProject.imageSrc);
    }

    return updatedProject;
  }

  async remove(id: number): Promise<{ deleted: true; id: number }> {
    const existingProject = await this.findOne(id);

    await this.prisma.project.delete({
      where: { id },
    });

    this.deleteManagedPreviewFile(existingProject.imageSrc);

    return { deleted: true, id };
  }

  private deleteManagedPreviewFile(imageSrc: string | null | undefined): void {
    if (!imageSrc) return;

    const normalizedImageSrc = imageSrc.replace(/\\/g, '/');

    if (!normalizedImageSrc.startsWith(MANAGED_PREVIEW_PREFIX)) {
      return;
    }

    const relativePath = normalizedImageSrc.replace(/^\/+/, '');
    const absolutePath = resolve(process.cwd(), relativePath);

    if (
      absolutePath !== MANAGED_PREVIEW_ROOT
      && !absolutePath.startsWith(`${MANAGED_PREVIEW_ROOT}${sep}`)
    ) {
      return;
    }

    rmSync(absolutePath, { force: true });
  }
}
