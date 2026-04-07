import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/providers/prisma.module';
import { AuditProcessor } from './audit.processor';
import { AuditService } from './audit.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit-logging',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    }),
    PrismaModule,
  ],
  providers: [AuditService, AuditProcessor],
  exports: [AuditService],
})
export class AuditModule {}
