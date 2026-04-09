import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Task, TaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'src/common/providers/prisma.service';
import { AuditService } from 'src/modules/audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type RequestUser = {
  id: number;
  role: UserRole;
};

type TaskListItem = {
  createdAt: Date;
  description: string | null;
  id: number;
  priority: number;
  status: TaskStatus;
  title: string;
  updatedAt: Date;
  creator: { fullName: string | null; email: string };
  assigneeId: number | null;
  creatorId: number;
  assignee: { fullName: string | null; email: string } | null;
};

type TaskListMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type TaskListResponse = {
  result: TaskListItem[];
  meta: TaskListMeta;
};

const taskDisplaySelect = {
  createdAt: true,
  description: true,
  id: true,
  priority: true,
  status: true,
  title: true,
  updatedAt: true,
  creator: {
    select: {
      fullName: true,
      email: true,
    },
  },
  assigneeId: true,
  creatorId: true,
  assignee: {
    select: {
      fullName: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

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

    const task = await this.prismaService.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        creatorId: actor.id,
        assigneeId: createTaskDto.assignedToId,
      },
    });

    // Log to audit queue (fire-and-forget)
    this.auditService
      .logTaskCreation(actor.id, task.id, {
        title: task.title,
        description: task.description,
        status: task.status,
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
      })
      .catch((error) => {
        // Log error but don't throw - audit logging failures shouldn't block operations
        console.error('Failed to queue audit log for task creation:', error);
      });

    return this.prismaService.task.findUniqueOrThrow({
      where: { id: task.id },
      select: taskDisplaySelect,
    });
  }

  async findAllTasks(
    actor: RequestUser,
    query?: {
      search?: string;
      status?: TaskStatus;
      page?: number;
      limit?: number;
      assigneeId?: number;
      creatorId?: number;
    },
  ): Promise<TaskListResponse> {
    const isAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.SYSTEM_ADMIN;

    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.max(1, query?.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = isAdmin
      ? {}
      : { assigneeId: actor.id };

    if (query?.search?.trim()) {
      where.OR = [
        {
          title: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (isAdmin) {
      if (query?.assigneeId) {
        where.assigneeId = query.assigneeId;
      }

      if (query?.creatorId) {
        where.creatorId = query.creatorId;
      }
    }

    const [tasks, total] = await Promise.all([
      this.prismaService.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: taskDisplaySelect,
        skip,
        take: limit,
      }),
      this.prismaService.task.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      result: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages,
        count: tasks.length,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateTask(
    taskId: number,
    updateTaskDto: UpdateTaskDto,
    actor: RequestUser,
  ): Promise<Task> {
    this.assertAdmin(actor);

    const oldTask = await this.prismaService.task.findUnique({
      where: { id: taskId },
    });

    if (!oldTask) {
      throw new NotFoundException('Task not found');
    }

    if (updateTaskDto.assignedToId !== undefined) {
      const assignee = await this.prismaService.user.findUnique({
        where: { id: updateTaskDto.assignedToId },
        select: { id: true, isActive: true },
      });

      if (!assignee || !assignee.isActive) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    const newTask = await this.prismaService.task.update({
      where: { id: taskId },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        assigneeId: updateTaskDto.assignedToId,
      },
    });

    // Prepare before/after payloads
    const before: Record<string, any> = {};
    const after: Record<string, any> = {};

    if (updateTaskDto.title !== undefined) {
      before.title = oldTask.title;
      after.title = newTask.title;
    }
    if (updateTaskDto.description !== undefined) {
      before.description = oldTask.description;
      after.description = newTask.description;
    }
    if (updateTaskDto.assignedToId !== undefined) {
      before.assigneeId = oldTask.assigneeId;
      after.assigneeId = newTask.assigneeId;
    }

    // Log to audit queue (fire-and-forget)
    this.auditService
      .logTaskUpdate(actor.id, taskId, before, after)
      .catch((error) => {
        console.error('Failed to queue audit log for task update:', error);
      });

    // If assignee changed, also log assignment change
    if (updateTaskDto.assignedToId !== undefined) {
      this.auditService
        .logTaskAssignmentChange(
          actor.id,
          taskId,
          oldTask.assigneeId,
          newTask.assigneeId,
        )
        .catch((error) => {
          console.error(
            'Failed to queue audit log for assignment change:',
            error,
          );
        });
    }

    return this.prismaService.task.findUniqueOrThrow({
      where: { id: taskId },
      select: taskDisplaySelect,
    });
  }

  async deleteTask(
    taskId: number,
    actor: RequestUser,
  ): Promise<{ message: string }> {
    this.assertAdmin(actor);

    const task = await this.prismaService.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prismaService.task.delete({
      where: { id: taskId },
    });

    // Log to audit queue (fire-and-forget)
    this.auditService
      .logTaskDeletion(actor.id, taskId, {
        title: task.title,
        description: task.description,
        status: task.status,
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
      })
      .catch((error) => {
        console.error('Failed to queue audit log for task deletion:', error);
      });

    return { message: 'Task deleted successfully' };
  }

  async findMyTasksWithFilters(
    actor: RequestUser,
    search?: string,
    status?: TaskStatus,
    page = 1,
    limit = 10,
  ): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereClause: Record<string, unknown> = { assigneeId: actor.id };

    // Add search filter if provided
    if (search && search.trim()) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const currentPage = Math.max(1, page);
    const currentLimit = Math.max(1, limit);
    const skip = (currentPage - 1) * currentLimit;

    const [tasks, total] = await Promise.all([
      this.prismaService.task.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: currentLimit,
      }),
      this.prismaService.task.count({ where: whereClause }),
    ]);

    return {
      tasks,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.max(1, Math.ceil(total / currentLimit)),
    };
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
        status: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.SYSTEM_ADMIN;

    if (!isAdmin && task.assigneeId !== actor.id) {
      throw new ForbiddenException('You can update only your assigned tasks');
    }

    const oldStatus = task.status;

    const updatedTask = await this.prismaService.task.update({
      where: { id: taskId },
      data: {
        status: dto.status as TaskStatus,
      },
    });

    // Log to audit queue (fire-and-forget)
    this.auditService
      .logTaskStatusChange(actor.id, taskId, oldStatus, updatedTask.status)
      .catch((error) => {
        console.error('Failed to queue audit log for status change:', error);
      });

    return this.prismaService.task.findUniqueOrThrow({
      where: { id: taskId },
      select: taskDisplaySelect,
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
