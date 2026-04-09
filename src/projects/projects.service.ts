import { rmSync } from 'fs';
import { Project } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { resolve, sep } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
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
