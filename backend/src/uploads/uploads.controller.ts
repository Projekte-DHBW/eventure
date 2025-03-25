import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  Res,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { UploadsService } from './uploads.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return { filename: file.filename };
  }

  @Get('images/:filename')
  getImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Image not found');
    }

    return res.sendFile(imagePath);
  }

  @Delete('images/:filename')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  deleteImage(@Param('filename') filename: string) {
    const imagePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Image not found');
    }

    fs.unlinkSync(imagePath);
    return { success: true };
  }
}
