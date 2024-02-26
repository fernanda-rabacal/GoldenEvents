import { IsDate, IsNumber, IsString } from 'class-validator';

export class QueryEventDto {
  @IsString()
  name: string;

  @IsNumber()
  category_id: number;

  @IsNumber()
  skip: number = 0;

  @IsNumber()
  take: number = 10;

  @IsDate()
  start_date: Date;

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

    if (this.category_id) {
      where = {
        ...where,
        category_id: this.category_id,
      };
    }

    if (this.start_date) {
      //tratamento do intervalo
      where = {
        ...where,
        start_date: {
          gte: new Date(this.start_date).toISOString(),
          lte: new Date(this.start_date).toISOString(),
        },
      };
    }

    return where;
  }
}
