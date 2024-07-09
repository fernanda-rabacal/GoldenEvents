import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QueryEventDto {
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsOptional()
  @ApiProperty()
  active?: string;

  @IsOptional()
  @ApiProperty()
  category_id?: number;

  @IsOptional()
  @ApiProperty()
  skip: number = 0;

  @IsOptional()
  @ApiProperty()
  take: number = 10;

  @IsOptional()
  @ApiProperty()
  start_date?: Date;

  public mountWhere() {
    let where = {};

    if (this.name) {
      where = {
        ...where,
        name: {
          contains: this.name,
        },
      };
    }

    if (this.active) {
      where = {
        ...where,
        active: Boolean(Number(this.active)),
      };
    }

    if (this.category_id) {
      where = {
        ...where,
        category_id: Number(this.category_id),
      };
    }

    if (this.start_date) {
      //tratamento do intervalo
      where = {
        ...where,
        start_date: {
          gte: new Date(this.start_date),
        },
      };
    }

    return where;
  }
}
