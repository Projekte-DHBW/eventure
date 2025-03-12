import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventFiltersDto } from './dto/EventFilters';
import { CreateEventDto } from './dto/CreateEvent';
import { UpdateEventDto } from './dto/UpdateEvent';
import { GetUser } from 'src/auth/jwtData.decorator';
import { User } from 'src/entity/User';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createEventDto: CreateEventDto, @GetUser() user: User) {
    return this.eventsService.create(createEventDto, user);
  }

  @Get()
  findAll(@Query() filters: EventFiltersDto) {
    return this.eventsService.findAll(filters);
  }

  @Get('latest')
  getLatestEvents(@Query('limit') limit: number) {
    return this.eventsService.getLatestEvents(limit);
  }

  @Get('popular')
  getPopularEvents(@Query('limit') limit: number) {
    return this.eventsService.getPopularEvents(limit);
  }

  @Get('category/:category')
  getEventsByCategory(
    @Param('category') category: string,
    @Query('limit') limit: number,
  ) {
    return this.eventsService.getEventsByCategory(category, limit);
  }

  @UseGuards(AuthGuard)
  @Get('my')
  findMyEvents(@Request() req) {
    return this.eventsService.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOneById(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
  ) {
    return this.eventsService.update(id, updateEventDto, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.eventsService.remove(id, req.user.id);
  }
}
