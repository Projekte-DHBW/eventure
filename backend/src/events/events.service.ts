import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entity/Event';
import { EventLocation } from '../entity/EventLocation';
import { EventOccurrence } from '../entity/EventOccurrence';
import { CreateEventDto } from './dto/CreateEvent';
import { EventFiltersDto } from './dto/EventFilters';
import { UpdateEventDto } from './dto/UpdateEvent';
import { User } from 'src/entity/User';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, user: User): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      creator: user.id,
    });

    return this.eventRepository.save(event);
  }

  async findAll(filters: EventFiltersDto): Promise<[Event[], number]> {
    const { search, category, sort, page = 1, limit = 10 } = filters;

    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.visibility = :visibility', { visibility: 'public' });

    if (search) {
      query.andWhere(
        '(event.title LIKE :search OR event.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      query.andWhere('event.category = :category', { category });
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query.orderBy('event.createdAt', 'DESC');
        break;
      case 'popular':
        query.orderBy('event.maxParticipants', 'DESC');
        break;
      default:
        query.orderBy('event.createdAt', 'DESC');
    }

    // Apply pagination
    query.skip((page - 1) * limit).take(limit);

    return query.getManyAndCount();
  }

  async findOneById(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findByUser(userId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { creator: userId },
    });
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: string,
  ): Promise<Event> {
    const event = await this.findOneById(id);

    // Check if the user has permission to update this event
    if (event.creator !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to update this event',
      );
    }

    await this.eventRepository.update(id, updateEventDto);
    return this.findOneById(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const event = await this.findOneById(id);

    // Check if the user has permission to delete this event
    if (event.creator !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to delete this event',
      );
    }

    await this.eventRepository.delete(id);
  }

  async getLatestEvents(limit: number = 5): Promise<Event[]> {
    return this.eventRepository.find({
      where: { visibility: 'public' },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getPopularEvents(limit: number = 5): Promise<Event[]> {
    return this.eventRepository.find({
      where: { visibility: 'public' },
      order: { maxParticipants: 'DESC' },
      take: limit,
    });
  }

  async getEventsByCategory(
    category: string,
    limit: number = 5,
  ): Promise<Event[]> {
    return this.eventRepository.find({
      where: {
        visibility: 'public',
        category: category as 'music' | 'sports' | 'culture' | 'other',
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Search for cities matching the provided query using Event location field
   * @param query Search string for city name
   * @param limit Maximum number of results to return
   * @returns List of unique cities matching the query
   */
  async searchCities(query: string, limit: number = 10): Promise<string[]> {
    const lowercaseQuery = query.toLowerCase();

    // Query the location field directly from the Event table
    const results = await this.eventRepository
      .createQueryBuilder('event')
      .where('LOWER(event.location) LIKE LOWER(:query)', {
        query: `%${lowercaseQuery}%`,
      })
      .select('event.location', 'location')
      .distinct(true)
      .limit(limit)
      .getRawMany();

    // Extract the location values from the results
    const locations = results
      .map((result) => result.location)
      .filter(
        (location) =>
          location !== null && location !== undefined && location.trim() !== '',
      );

    return locations;
  }
}
