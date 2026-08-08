import { IsString, IsJWT } from 'class-validator';
import { LoginDto, RegisterDto } from '../../user/dto/user.dto';

export { LoginDto, RegisterDto };

export class RefreshDto {
  @IsString()
  @IsJWT()
  refreshToken: string;
}
