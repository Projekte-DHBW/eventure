import { Module } from '@nestjs/common';
import { OpenaiController } from './openai.controller';
import { OpenaiService } from './openai.service';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/entity/RefreshToken';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(),
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  controllers: [OpenaiController],
  providers: [OpenaiService, AuthService],
  exports: [OpenaiService],
})
export class OpenAiModule {}
