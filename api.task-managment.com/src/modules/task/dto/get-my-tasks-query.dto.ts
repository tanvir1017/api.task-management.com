import { TaskStatus } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class GetMyTasksQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: TaskStatus;
}
