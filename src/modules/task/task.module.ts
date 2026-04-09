import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/providers/prisma.module';
import { AuditModule } from 'src/modules/audit/audit.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
