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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventFiltersDto } from './dto/EventFilters';
import { CreateEventDto } from './dto/CreateEvent';
import { UpdateEventDto } from './dto/UpdateEvent';
import { GetUser } from 'src/auth/jwtData.decorator';
import { User } from 'src/entity/User';
import { AuthGuard } from 'src/auth/auth.guard';
import { CitySearchDto } from './dto/CitySearch';


@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createEventDto: CreateEventDto, @GetUser() user: User) {
    return this.eventsService.createEvent(createEventDto, user);
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
    return this.eventsService.findOne(id);
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

  /**
   * Search for cities for autocomplete
   * @param searchDto Search parameters (query & limit)
   * @returns List of matching city names
   */
  @Get('cities/search')
  async searchCities(@Query() searchDto: CitySearchDto) {
    return {
      cities: await this.eventsService.searchCities(
        searchDto.query,
        searchDto.limit,
      ),
    };
  }

  /*@UseGuards(AuthGuard)
  @Post(':id/signup')
  
  async inviteUser(
    @Body() body: { eventId: string; },
    @GetUser() currentUser: User,
    
     ): Promise<{ success: boolean }> {
    return this.eventsService.inviteUser(currentUser.id, body.eventId);
  }*/
  
  @UseGuards(AuthGuard)
  @Post(':id/signup')
  
  async inviteUser(@Param('id') eventId: string, @GetUser() user: User, ): Promise<{ success: boolean }> {
    await this.eventsService.inviteUser(user.id, eventId);
    return { success: true }; // Rückgabe des Erfolgsstatus
  }

}
