import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import { Queue } from 'bullmq';

export interface AuditLogPayload {
  before?: Record<string, any>;
  after?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(@InjectQueue('audit-logging') private auditQueue: Queue) {}

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
}
