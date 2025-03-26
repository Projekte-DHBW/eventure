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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { Event } from '../entity/Event';
import { EventResponseDto } from './dto/EventResponse.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: Event,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createEventDto: CreateEventDto, @GetUser() user: User) {
    return this.eventsService.createEvent(createEventDto, user);
  }

  @ApiOperation({ summary: 'Alle Events mit Filtern abrufen' })
  @ApiResponse({
    status: 200,
    description: 'Liste der gefilterten Events',
    schema: {
      properties: {
        events: {
          type: 'array',
          items: { $ref: getSchemaPath(Event) },
        },
        total: { type: 'number' },
      },
    },
  })
  @Get()
  async findAll(@Query() filters: EventFiltersDto) {
    const [events, total] = await this.eventsService.findAll(filters);
    return { events, total };
  }

  @ApiOperation({ summary: 'Get latest events' })
  @ApiResponse({
    status: 200,
    description: 'List of latest events',
    type: [Event],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of events to return',
  })
  @Get('latest')
  getLatestEvents(@Query('limit') limit: number) {
    return this.eventsService.getLatestEvents(limit);
  }

  @ApiOperation({ summary: 'Get popular events' })
  @ApiResponse({
    status: 200,
    description: 'List of popular events',
    type: [Event],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of events to return',
  })
  @Get('popular')
  getPopularEvents(@Query('limit') limit: number) {
    return this.eventsService.getPopularEvents(limit);
  }

  @ApiOperation({ summary: 'Get events by category' })
  @ApiResponse({
    status: 200,
    description: 'List of events in the specified category',
    type: [Event],
  })
  @ApiParam({ name: 'category', description: 'Event category' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of events to return',
  })
  @Get('category/:category')
  getEventsByCategory(
    @Param('category') category: string,
    @Query('limit') limit: number,
  ) {
    return this.eventsService.getEventsByCategory(category, limit);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's events" })
  @ApiResponse({
    status: 200,
    description: "List of user's events",
    type: [Event],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Get('my')
  findMyEvents(@GetUser() user: User) {
    return this.eventsService.findByUser(user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get events the user is attending' })
  @ApiResponse({
    status: 200,
    description: 'List of events the user is attending',
    type: [Event],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Get('attending')
  findAttendingEvents(@GetUser() user: User) {
    return this.eventsService.findAttendingEvents(user.id);
  }

  @ApiOperation({ summary: 'Nach Städten suchen' })
  @ApiResponse({
    status: 200,
    description: 'Liste der passenden Städtenamen',
    schema: {
      properties: {
        cities: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @Get('cities/search')
  async searchCities(@Query() searchDto: CitySearchDto) {
    return {
      cities: await this.eventsService.searchCities(
        searchDto.query,
        searchDto.limit,
      ),
    };
  }

  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event found successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: Event,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.update(id, updateEventDto, user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.eventsService.remove(id, user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join an event' })
  @ApiResponse({ status: 200, description: 'Successfully joined the event' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @UseGuards(AuthGuard)
  @Post(':id/join')
  async joinEvent(@Param('id') id: string, @GetUser() user: User) {
    await this.eventsService.addAttendee(id, user.id);
    return { success: true };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave an event' })
  @ApiResponse({ status: 200, description: 'Successfully left the event' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Post(':id/leave')
  async leaveEvent(@Param('id') id: string, @GetUser() user: User) {
    await this.eventsService.removeAttendee(id, user.id);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Post(':id/signup')
  async inviteUser(
    @Param('id') eventId: string,
    @GetUser() user: User,
  ): Promise<{ success: boolean }> {
    await this.eventsService.inviteUser(user.id, eventId);
    return { success: true }; // Rückgabe des Erfolgsstatus
  }

  @UseGuards(AuthGuard)
  @Get(':id/check-registration')
  async checkRegistration(
    @Query('eventId') eventId: string,
    @Query('userId') userId: string,
  ) {
    console.log(
      'checkRegistration aufgerufen mit userId:',
      userId,
      'und eventId:',
      eventId,
    );
    const isRegistered = await this.eventsService.isUserRegistered(
      userId,
      eventId,
    );
    return { isRegistered };
  }

  @UseGuards(AuthGuard)
  @Delete(':eventId/unregister')
  async unregisterUser(
    @Query('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    console.log('Unregistering user:', userId, 'from event:', eventId);
    await this.eventsService.unregisterUser(userId, eventId);
    return { message: 'User unregistered successfully' };
  }
}
