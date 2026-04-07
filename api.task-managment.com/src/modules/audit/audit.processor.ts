import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from 'src/common/providers/prisma.service';

interface AuditJobData {
  actorId: number;
  actionType: AuditActionType;
  targetEntity: number;
  payload: Record<string, any>;
}

@Processor('audit-logging')
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<void> {
    try {
      const { actorId, actionType, targetEntity, payload } = job.data;

      await this.prisma.auditLog.create({
        data: {
          actorId,
          actionType,
          targetEntity,
          payload,
        },
      });

      this.logger.debug(
        `Audit log created: ${actionType} for task ${targetEntity} by user ${actorId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      throw error; // Throw to trigger retry
    }
  }
}
