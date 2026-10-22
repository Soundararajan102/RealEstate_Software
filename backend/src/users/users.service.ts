import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async generateNextEmployeeId(): Promise<string> {
    const lastUser = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { employeeId: true },
    });

    if (!lastUser || !lastUser.employeeId.startsWith('EMP-')) {
      return 'EMP-1004';
    }

    const numPart = parseInt(lastUser.employeeId.replace('EMP-', ''), 10);
    const nextNum = isNaN(numPart) ? 1004 : numPart + 1;
    return `EMP-${nextNum}`;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        assignedProjects: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        assignedProjects: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An employee with this email already exists');
    }

    const employeeId = await this.generateNextEmployeeId();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        employeeId,
        fullName: dto.fullName,
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        isActive: true,
        assignedProjects: dto.assignedProjects || [],
      },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        assignedProjects: true,
        createdAt: true,
      },
    });
  }

  async toggleStatus(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }
}
