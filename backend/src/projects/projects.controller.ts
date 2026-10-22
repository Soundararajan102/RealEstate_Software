import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreatePlotDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, PlotStatus, Facing } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  async findAllProjects() {
    return this.projectsService.findAllProjects();
  }

  @Get('projects/:id')
  async findOneProject(@Param('id') id: string) {
    return this.projectsService.findOneProject(id);
  }

  @Post('projects')
  @Roles(Role.ADMIN)
  async createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Get('projects/:id/plots')
  async findProjectPlots(
    @Param('id') projectId: string,
    @Query('status') status?: PlotStatus,
    @Query('facing') facing?: Facing,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findProjectPlots(projectId, { status, facing, search });
  }

  @Get('plots/:id')
  async findOnePlot(@Param('id') id: string) {
    return this.projectsService.findOnePlot(id);
  }

  @Post('projects/:id/plots')
  @Roles(Role.ADMIN)
  async createPlot(@Param('id') projectId: string, @Body() dto: CreatePlotDto) {
    return this.projectsService.createPlot(projectId, dto);
  }
}
