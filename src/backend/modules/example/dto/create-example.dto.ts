import { IsString, IsNotEmpty } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
