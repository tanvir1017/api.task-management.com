import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Task, TaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'src/common/providers/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type RequestUser = {
  id: number;
  role: UserRole;
};

@Injectable()
export class TaskService {
  constructor(private readonly prismaService: PrismaService) {}

  async createTask(
    createTaskDto: CreateTaskDto,
    actor: RequestUser,
  ): Promise<Task> {
    this.assertAdmin(actor);

    const assignee = await this.prismaService.user.findUnique({
      where: { id: createTaskDto.assignedToId },
      select: { id: true, isActive: true },
    });

    if (!assignee || !assignee.isActive) {
      throw new NotFoundException('Assigned user not found');
    }

    return this.prismaService.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        creatorId: actor.id,
        assigneeId: createTaskDto.assignedToId,
      },
    });
  }

  async findAllTasks(actor: RequestUser): Promise<Task[]> {
    this.assertAdmin(actor);

    return this.prismaService.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTask(
    taskId: number,
    updateTaskDto: UpdateTaskDto,
    actor: RequestUser,
  ): Promise<Task> {
    this.assertAdmin(actor);

    await this.ensureTaskExists(taskId);

    if (updateTaskDto.assignedToId !== undefined) {
      const assignee = await this.prismaService.user.findUnique({
        where: { id: updateTaskDto.assignedToId },
        select: { id: true, isActive: true },
      });

      if (!assignee || !assignee.isActive) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    return this.prismaService.task.update({
      where: { id: taskId },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        assigneeId: updateTaskDto.assignedToId,
      },
    });
  }

  async deleteTask(
    taskId: number,
    actor: RequestUser,
  ): Promise<{ message: string }> {
    this.assertAdmin(actor);

    await this.ensureTaskExists(taskId);

    await this.prismaService.task.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  }

  async findMyTasks(actor: RequestUser): Promise<Task[]> {
    return this.prismaService.task.findMany({
      where: { assigneeId: actor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMyTaskStatus(
    taskId: number,
    dto: UpdateTaskStatusDto,
    actor: RequestUser,
  ): Promise<Task> {
    const task = await this.prismaService.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        assigneeId: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.assigneeId !== actor.id) {
      throw new ForbiddenException('You can update only your assigned tasks');
    }

    return this.prismaService.task.update({
      where: { id: taskId },
      data: {
        status: dto.status as TaskStatus,
      },
    });
  }

  private assertAdmin(actor: RequestUser): void {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only admin can perform this action');
    }
  }

  private async ensureTaskExists(taskId: number): Promise<void> {
    const task = await this.prismaService.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }
}
