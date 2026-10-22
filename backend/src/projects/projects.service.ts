import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, CreatePlotDto } from './dto/project.dto';
import { PlotStatus, Facing } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAllProjects() {
    const projects = await this.prisma.project.findMany({
      include: {
        _count: {
          select: { plots: true },
        },
        plots: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => {
      const available = p.plots.filter((pl) => pl.status === PlotStatus.AVAILABLE).length;
      const booked = p.plots.filter((pl) => pl.status === PlotStatus.BOOKED).length;
      const sold = p.plots.filter((pl) => pl.status === PlotStatus.SOLD).length;

      return {
        id: p.id,
        name: p.name,
        location: p.location,
        description: p.description,
        totalAreaSqFt: p.totalAreaSqFt,
        totalPlots: p.totalPlots || p._count.plots,
        status: p.status,
        counts: {
          total: p._count.plots,
          available,
          booked,
          sold,
        },
        createdAt: p.createdAt,
      };
    });
  }

  async findOneProject(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        plots: {
          orderBy: { plotNumber: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const available = project.plots.filter((pl) => pl.status === PlotStatus.AVAILABLE).length;
    const booked = project.plots.filter((pl) => pl.status === PlotStatus.BOOKED).length;
    const sold = project.plots.filter((pl) => pl.status === PlotStatus.SOLD).length;

    return {
      ...project,
      counts: {
        total: project.plots.length,
        available,
        booked,
        sold,
      },
    };
  }

  async createProject(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        location: dto.location,
        description: dto.description,
        totalAreaSqFt: dto.totalAreaSqFt,
        totalPlots: dto.totalPlots || 0,
        status: dto.status,
      },
    });
  }

  async findProjectPlots(
    projectId: string,
    filters?: {
      status?: PlotStatus;
      facing?: Facing;
      search?: string;
    },
  ) {
    const where: any = { projectId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.facing) {
      where.facing = filters.facing;
    }

    if (filters?.search) {
      where.OR = [
        { plotNumber: { contains: filters.search, mode: 'insensitive' } },
        { surveyNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.plot.findMany({
      where,
      orderBy: { plotNumber: 'asc' },
    });
  }

  async findOnePlot(id: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, location: true },
        },
        bookings: {
          include: {
            customer: true,
            broker: true,
            payments: true,
          },
        },
      },
    });

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }

    return plot;
  }

  async createPlot(projectId: string, dto: CreatePlotDto) {
    const existing = await this.prisma.plot.findUnique({
      where: {
        projectId_plotNumber: {
          projectId,
          plotNumber: dto.plotNumber.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Plot ${dto.plotNumber} already exists in this project`);
    }

    const rate = dto.ratePerSqFt;
    const area = dto.areaSqFt;
    const totalPrice = area * rate;

    const plot = await this.prisma.plot.create({
      data: {
        projectId,
        plotNumber: dto.plotNumber.trim(),
        surveyNumber: dto.surveyNumber,
        facing: dto.facing || Facing.NORTH,
        dimension: dto.dimension,
        areaSqFt: area,
        ratePerSqFt: rate,
        totalPrice,
        isCornerPlot: dto.isCornerPlot || false,
        status: dto.status || PlotStatus.AVAILABLE,
      },
    });

    // Update project total plots count
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        totalPlots: {
          increment: 1,
        },
      },
    });

    return plot;
  }
}
