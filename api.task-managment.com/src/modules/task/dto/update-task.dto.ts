import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({ example: 'Prepare sprint report - updated', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiProperty({
    example: 'Updated scope and fixed sprint metrics section',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsInt()
  assignedToId?: number;
}
