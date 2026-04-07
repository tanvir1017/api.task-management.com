import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Task, UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetMyTasksQueryDto } from './dto/get-my-tasks-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

type RequestUser = {
  id: number;
  role: UserRole;
};

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a task (Admin only)' })
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: Request,
  ): Promise<Task> {
    return this.taskService.createTask(createTaskDto, req.user as RequestUser);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get all tasks (Admin only)' })
  getAllTasks(@Req() req: Request): Promise<Task[]> {
    return this.taskService.findAllTasks(req.user as RequestUser);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update task details (Admin only)' })
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: Request,
  ): Promise<Task> {
    return this.taskService.updateTask(
      id,
      updateTaskDto,
      req.user as RequestUser,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete task (Admin only)' })
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.taskService.deleteTask(id, req.user as RequestUser);
  }

  @Get('my')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get my assigned tasks (User only)' })
  getMyTasks(@Req() req: Request): Promise<Task[]> {
    return this.taskService.findMyTasks(req.user as RequestUser);
  }

  @Get('my-task')
  @Roles(UserRole.USER)
  @ApiOperation({
    summary: 'Get my assigned tasks with search and status filter (User only)',
  })
  getMyTasksWithFilters(
    @Query() query: GetMyTasksQueryDto,
    @Req() req: Request,
  ): Promise<Task[]> {
    return this.taskService.findMyTasksWithFilters(
      req.user as RequestUser,
      query.search,
      query.status,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Update my task status (User only)' })
  updateMyTaskStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Req() req: Request,
  ): Promise<Task> {
    return this.taskService.updateMyTaskStatus(
      id,
      updateTaskStatusDto,
      req.user as RequestUser,
    );
  }
}
