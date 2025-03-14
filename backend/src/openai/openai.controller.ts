import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @UseGuards(AuthGuard)
  @Get('enhance')
  enhance(
    @Query('text') text: string,
    @Query('title') title: string,
    @Query('category') category: string,
  ) {
    return this.openaiService.enhance(text, title, category);
  }
}
