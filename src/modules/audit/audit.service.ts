import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/common/providers/prisma.service';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';

export interface AuditLogPayload {
  before?: Record<string, any>;
  after?: Record<string, any>;
}

type AuditLogListMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AuditLogListResponse<T> = {
  result: T[];
  meta: AuditLogListMeta;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectQueue('audit-logging') private auditQueue: Queue,
    private readonly prismaService: PrismaService,
  ) {}

  async logTaskCreation(
    actorId: number,
    taskId: number,
    taskData: Record<string, any>,
  ): Promise<void> {
    await this.auditQueue.add(
      'log-audit',
      {
        actorId,
        actionType: AuditActionType.CREATE_TASK,
        targetEntity: taskId,
        payload: { after: taskData },
      },
      { jobId: `create-task-${taskId}-${Date.now()}` },
    );
  }

  async logTaskUpdate(
    actorId: number,
    taskId: number,
    before: Record<string, any>,
    after: Record<string, any>,
  ): Promise<void> {
    await this.auditQueue.add(
      'log-audit',
      {
        actorId,
        actionType: AuditActionType.UPDATE_TASK,
        targetEntity: taskId,
        payload: { before, after },
      },
      { jobId: `update-task-${taskId}-${Date.now()}` },
    );
  }

  async logTaskDeletion(
    actorId: number,
    taskId: number,
    deletedTaskData: Record<string, any>,
  ): Promise<void> {
    await this.auditQueue.add(
      'log-audit',
      {
        actorId,
        actionType: AuditActionType.DELETE_TASK,
        targetEntity: taskId,
        payload: { before: deletedTaskData },
      },
      { jobId: `delete-task-${taskId}-${Date.now()}` },
    );
  }

  async logTaskStatusChange(
    actorId: number,
    taskId: number,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    await this.auditQueue.add(
      'log-audit',
      {
        actorId,
        actionType: AuditActionType.UPDATE_STATUS,
        targetEntity: taskId,
        payload: {
          before: { status: oldStatus },
          after: { status: newStatus },
        },
      },
      { jobId: `status-task-${taskId}-${Date.now()}` },
    );
  }

  async logTaskAssignmentChange(
    actorId: number,
    taskId: number,
    oldAssigneeId: number | null,
    newAssigneeId: number | null,
  ): Promise<void> {
    await this.auditQueue.add(
      'log-audit',
      {
        actorId,
        actionType: AuditActionType.ASSIGN_TASK,
        targetEntity: taskId,
        payload: {
          before: { assigneeId: oldAssigneeId },
          after: { assigneeId: newAssigneeId },
        },
      },
      { jobId: `assign-task-${taskId}-${Date.now()}` },
    );
  }

  async getAuditLogsByTaskId(taskId: number, query?: GetAuditLogsQueryDto) {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.max(1, query?.limit ?? 25);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { targetEntity: taskId };

    if (query?.search?.trim()) {
      where.OR = [
        {
          actionType: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query?.actionType) {
      where.actionType = query.actionType;
    }

    if (query?.actorId) {
      where.actorId = query.actorId;
    }

    const [logs, total] = await Promise.all([
      this.prismaService.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.auditLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      result: logs,
      meta: {
        total,
        page,
        limit,
        totalPages,
        count: logs.length,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    } satisfies AuditLogListResponse<(typeof logs)[number]>;
  }

  async getAllAuditLogs(query?: GetAuditLogsQueryDto) {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.max(1, query?.limit ?? 25);
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    const orConditions: any[] = [];

    if (query?.search?.trim()) {
      const search = query.search.trim();
      const numericTargetEntity = Number(search);

      orConditions.push(
        {
          actionType: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          actor: {
            OR: [
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                username: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                fullName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      );

      if (!Number.isNaN(numericTargetEntity)) {
        orConditions.push({ targetEntity: numericTargetEntity });
      }
    }

    if (query?.actionType) {
      where.actionType = query.actionType;
    }

    if (query?.actorId) {
      where.actorId = query.actorId;
    }

    if (query?.targetEntity) {
      where.targetEntity = query.targetEntity;
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    const [logs, total] = await Promise.all([
      this.prismaService.auditLog.findMany({
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        where,
      }),
      this.prismaService.auditLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      result: logs,
      meta: {
        total,
        page,
        limit,
        totalPages,
        count: logs.length,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    } satisfies AuditLogListResponse<(typeof logs)[number]>;
  }

  async deleteAuditLogById(id: number) {
    const auditLog = await this.prismaService.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with id ${id} not found`);
    }

    return await this.prismaService.auditLog.delete({
      where: { id },
    });
  }

  async deleteAuditLogsByTaskId(taskId: number) {
    return await this.prismaService.auditLog.deleteMany({
      where: { targetEntity: taskId },
    });
  }
}
