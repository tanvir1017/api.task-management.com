import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Prepare sprint report' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({
    example: 'Gather metrics and prepare the final sprint summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  assignedToId: number;
}
