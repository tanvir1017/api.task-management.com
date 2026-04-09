import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuditService } from './audit.service';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
  async getAllAuditLogs(@Query() query: GetAuditLogsQueryDto) {
    return await this.auditService.getAllAuditLogs(query);
  }

  @Get('tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get audit logs by task ID' })
  async getAuditLogsByTaskId(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query() query: GetAuditLogsQueryDto,
  ) {
    const result = await this.auditService.getAuditLogsByTaskId(taskId, query);

    if (!result.result || result.result.length === 0) {
      throw new NotFoundException(`No audit logs found for task ${taskId}`);
    }

    return result;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete an audit log by ID (Admin only)' })
  async deleteAuditLog(@Param('id', ParseIntPipe) id: number) {
    return await this.auditService.deleteAuditLogById(id);
  }

  @Delete('tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete all audit logs for a task (Admin only)' })
  async deleteAuditLogsByTaskId(@Param('taskId', ParseIntPipe) taskId: number) {
    return await this.auditService.deleteAuditLogsByTaskId(taskId);
  }
}
