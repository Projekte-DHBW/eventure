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
import type { EventsService } from './events.service';
import type { EventFiltersDto } from './dto/EventFilters';
import type { CreateEventDto } from './dto/CreateEvent';
import type { UpdateEventDto } from './dto/UpdateEvent';
import { GetUser } from 'src/auth/jwtData.decorator';
import type { User } from 'src/entity/User';
import { AuthGuard } from 'src/auth/auth.guard';
import type { CitySearchDto } from './dto/CitySearch';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Event } from '../entity/Event';

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

  @ApiOperation({ summary: 'Get all events with filters' })
  @ApiResponse({ status: 200, description: 'List of events', type: [Event] })
  @Get()
  findAll(@Query() filters: EventFiltersDto) {
    return this.eventsService.findAll(filters);
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

  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event details', type: Event })
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

  @ApiOperation({ summary: 'Search for cities' })
  @ApiResponse({
    status: 200,
    description: 'List of matching city names',
    type: Object,
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
}
