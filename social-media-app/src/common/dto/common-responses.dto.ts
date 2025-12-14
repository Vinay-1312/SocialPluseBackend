import { ApiProperty } from '@nestjs/swagger';

// Base Response - Inherit this for all API responses
export class BaseResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;
}

// Generic Data Response - Use for responses with a data field
export class DataResponseDto<T> extends BaseResponseDto {
  @ApiProperty({
    description: 'Response data',
  })
  data: T;
}

// Paginated Response - Use for paginated lists
export class PaginatedResponseDto<T> extends BaseResponseDto {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Error Response - For error cases
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message(s)',
    example: ['Email is required', 'Password must be at least 8 characters'],
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error: string;
}
