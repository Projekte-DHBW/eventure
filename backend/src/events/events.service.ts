import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Event } from '../entity/Event';
import { EventLocation } from '../entity/EventLocation';
import { EventOccurrence } from '../entity/EventOccurrence';
import { EventManager } from '../entity/EventManager';
import { Invitation } from '../entity/Invitation';
import { User } from 'src/entity/User';
import { CreateEventDto, EventLocationDto } from './dto/CreateEvent';
import { EventFiltersDto } from './dto/EventFilters';
import { UpdateEventDto } from './dto/UpdateEvent';
import { InvitedUsers } from 'src/entity/InvitedUsers';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventLocation)
    private eventLocationRepository: Repository<EventLocation>,
    @InjectRepository(EventOccurrence)
    private eventOccurrenceRepository: Repository<EventOccurrence>,
    @InjectRepository(EventManager)
    private eventManagerRepository: Repository<EventManager>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(InvitedUsers)
    private invitedUserRepository: Repository<InvitedUsers>,
  ) {}

  async createEvent(
    createEventDto: CreateEventDto,
    user: User,
  ): Promise<Event> {
    // 1. Create the base Event
    const event = this.eventRepository.create({
      title: createEventDto.title,
      description: createEventDto.description,
      visibility: createEventDto.visibility,
      category: createEventDto.category,
      coverImageUrl: createEventDto.coverImageUrl,
      maxParticipants: createEventDto.maxParticipants,
      creator: user.id,
      creatorObj: user,
      location: createEventDto.location,
      eventDate: createEventDto.eventDate,
      isOnline: createEventDto.isOnline || false,
      meetingLink: createEventDto.meetingLink,
    });

    // Save the event to get an ID
    const savedEvent = await this.eventRepository.save(event);

    // 2. Process Event Occurrences if provided
    if (createEventDto.occurrences && createEventDto.occurrences.length > 0) {
      await this.createEventOccurrences(savedEvent, createEventDto.occurrences);
    }

    // 3. Process Event Managers if provided
    if (createEventDto.managers && createEventDto.managers.length > 0) {
      await this.createEventManagers(savedEvent, createEventDto.managers);
    }

    // 4. Process Invitations if provided
    if (createEventDto.invitations && createEventDto.invitations.length > 0) {
      await this.createInvitations(savedEvent, createEventDto.invitations);
    }

    // 5. Return the complete event
    return this.findOne(savedEvent.id);
  }

  // Helper method to create event occurrences
  private async createEventOccurrences(
    event: Event,
    occurrences: CreateEventDto['occurrences'],
  ): Promise<void> {
    if (!occurrences || occurrences.length === 0) return;

    const occurrencePromises = occurrences.map(async (occurrenceDto) => {
      // Create location if provided
      let locationEntity: EventLocation | null = null;
      if (occurrenceDto.location) {
        locationEntity = await this.createEventLocation(occurrenceDto.location);
      }

      // Create occurrence with proper relation reference
      const occurrence = this.eventOccurrenceRepository.create({
        eventId: event.id, // Use the ID directly
        startDate: occurrenceDto.startDate,
        endDate: occurrenceDto.endDate,
        locationId: locationEntity?.id || null, // Use the ID or null
      });

      return this.eventOccurrenceRepository.save(occurrence);
    });

    await Promise.all(occurrencePromises);
  }

  // Helper method to create event location
  private async createEventLocation(
    locationDto: EventLocationDto,
  ): Promise<EventLocation> {
    const location = this.eventLocationRepository.create({
      address: locationDto.address,
      city: locationDto.city,
      state: locationDto.state,
      country: locationDto.country,
      postalCode: locationDto.postalCode,
      latitude: locationDto.latitude,
      longitude: locationDto.longitude,
    });

    return this.eventLocationRepository.save(location);
  }

  // Helper method to create event managers
  private async createEventManagers(
    event: Event,
    managers: CreateEventDto['managers'],
  ): Promise<void> {
    if (!managers || managers.length === 0) return;

    const managerPromises = managers.map(async (managerDto) => {
      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: managerDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${managerDto.userId} not found`,
        );
      }

      // Create manager relation
      const manager = this.eventManagerRepository.create({
        event,
        user,
      });

      return this.eventManagerRepository.save(manager);
    });

    await Promise.all(managerPromises);
  }

  // Helper method to create invitations
  private async createInvitations(
    event: Event,
    invitations: CreateEventDto['invitations'],
  ): Promise<void> {
    if (!invitations || invitations.length === 0) return;

    const invitationPromises = invitations.map(async (invitationDto) => {
      const invitation = this.invitationRepository.create({
        event,
        email: invitationDto.email,
        message: invitationDto.message,
        invitedAt: new Date(),
      });

      return this.invitationRepository.save(invitation);
    });

    await Promise.all(invitationPromises);
  }

  // Update the findOne method to include all related entities
  async findOne(id: string): Promise<Event> {
    // Find the event
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['creatorObj'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Find all occurrences with their locations
    const occurrences = await this.eventOccurrenceRepository.find({
      where: { event: { id } },
      relations: ['location'],
      order: { startDate: 'ASC' },
    });

    // Find all managers with their user info
    const managers = await this.eventManagerRepository.find({
      where: { event: { id } },
      relations: ['user'],
    });

    // Find all invitations
    const invitations = await this.invitationRepository.find({
      where: { event: { id } },
    });

    // Attach all related entities to the event
    (event as any).occurrences = occurrences;
    (event as any).managers = managers;
    (event as any).invitations = invitations;

    return event;
  }

  async findAll(filters: EventFiltersDto): Promise<[Event[], number]> {
    const { search, category, sort, page = 1, limit = 10, date } = filters;

    // Create base query for events
    let query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.visibility = :visibility', { visibility: 'public' });

    // Define date range variables outside both query blocks so they're in scope for both
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // Text search
    if (search) {
      query.andWhere(
        '(event.title LIKE :search OR event.description LIKE :search OR event.location LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Category filter
    if (category) {
      query.andWhere('event.category = :category', { category });
    }

    // Location filtering - FIXED
    if (filters.locations) {
      // Handle both string and array formats
      let locationList: string[] = [];

      if (typeof filters.locations === 'string') {
        locationList = filters.locations
          .split(',')
          .map((loc) => loc.trim())
          .filter(Boolean);
      } else if (Array.isArray(filters.locations)) {
        locationList = filters.locations.filter(Boolean);
      }

      if (locationList.length > 0) {
        query.andWhere('event.location IN (:...locations)', {
          locations: locationList,
        });
      }
    }

    // Date filtering - completely reworked
    if (date) {
      // Use a simple JOIN instead of leftJoinAndSelect
      query = query.leftJoin('event.occurrences', 'occurrence');

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Set date ranges based on filter
      switch (date) {
        case 'today':
          startDate = today;
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'tomorrow':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() + 1);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_week':
          startDate = today;
          endDate = new Date(today);
          const dayOfWeek = endDate.getDay();
          const daysUntilEndOfWeek = 6 - dayOfWeek; // 6 = Saturday (assuming Sunday is 0)
          endDate.setDate(endDate.getDate() + daysUntilEndOfWeek);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_month':
          startDate = today;
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_year':
          startDate = today;
          endDate = new Date(today.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // Specific date in YYYY-MM-DD format
            startDate = new Date(date);
            endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
          } else {
            // Default to today if unrecognized format
            startDate = today;
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
          }
      }

      // Log the dates for debugging
      console.log(
        `Date filter: ${date}, Range: ${startDate.toISOString()} to ${endDate.toISOString()}`,
      );

      // Use safer query approach
      query.andWhere(
        new Brackets((qb) => {
          qb.where('event.eventDate BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
          })
            .orWhere('occurrence.startDate BETWEEN :startDate AND :endDate', {
              startDate,
              endDate,
            })
            .orWhere(
              'occurrence.startDate <= :startDate AND occurrence.endDate >= :startDate',
              {
                startDate,
              },
            );
        }),
      );
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query.orderBy('event.createdAt', 'DESC');
        break;
      case 'popular':
        query.orderBy('event.maxParticipants', 'DESC');
        break;
      case 'upcoming':
        query.orderBy('event.eventDate', 'ASC');
        break;
      default:
        query.orderBy('event.createdAt', 'DESC');
    }

    query.skip((page - 1) * limit).take(limit);

    // Select necessary fields
    query.select([
      'event.id',
      'event.title',
      'event.description',
      'event.visibility',
      'event.category',
      'event.coverImageUrl',
      'event.maxParticipants',
      'event.eventDate',
      'event.location',
      'event.isOnline',
      'event.meetingLink',
      'event.creator',
      'event.createdAt',
      'event.updatedAt',
    ]);

    // Make the query distinct to avoid duplicates
    query.distinct(true);

    // Get total count using a separate query
    let totalCount = 0;
    try {
      // Create a new count query - don't reuse the where conditions directly
      const countQuery = this.eventRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.id)', 'count')
        .where('event.visibility = :visibility', { visibility: 'public' });

      // Apply the same text search if needed
      if (search) {
        countQuery.andWhere(
          '(event.title LIKE :search OR event.description LIKE :search OR event.location LIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Apply the same category filter if needed
      if (category) {
        countQuery.andWhere('event.category = :category', { category });
      }

      // Apply the same location filter if needed
      if (filters.locations) {
        let locationList: string[] = [];
        if (typeof filters.locations === 'string') {
          locationList = filters.locations
            .split(',')
            .map((loc) => loc.trim())
            .filter(Boolean);
        } else if (Array.isArray(filters.locations)) {
          locationList = filters.locations.filter(Boolean);
        }

        if (locationList.length > 0) {
          countQuery.andWhere('event.location IN (:...locations)', {
            locations: locationList,
          });
        }
      }

      // Apply the same date filter if needed
      if (date && startDate && endDate) {
        countQuery.leftJoin('event.occurrences', 'occurrence');

        // Apply the date filter condition
        countQuery.andWhere(
          new Brackets((qb) => {
            qb.where('event.eventDate BETWEEN :startDate AND :endDate', {
              startDate,
              endDate,
            })
              .orWhere('occurrence.startDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
              })
              .orWhere(
                'occurrence.startDate <= :startDate AND occurrence.endDate >= :startDate',
                {
                  startDate,
                },
              );
          }),
        );
      }

      // Execute the count query
      const result = await countQuery.getRawOne();
      totalCount = parseInt(result?.count || '0', 10);
      console.log(`Found ${totalCount} matching events`);
    } catch (error) {
      console.error('Error counting results:', error);
      totalCount = 0;
    }

    // Get the events with simpler query
    let events: Event[] = [];
    try {
      events = await query.getMany();
      console.log(`Retrieved ${events.length} events`);
    } catch (error) {
      console.error('Error fetching results:', error);
      events = [];
    }

    // Return the events and count
    return [events, totalCount];
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
    // Query the location field directly from the Event table
    const results = await this.eventRepository
      .createQueryBuilder('event')
      .where('LOWER(event.location) LIKE LOWER(:query)', {
        query: `%${query}%`,
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

  async inviteUser(userId: string, eventId: string): Promise<InvitedUsers> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const event = await this.eventRepository.findOne({ where: { id: eventId } });

    if (!user || !event) {
      throw new Error('User or Event not found');
    }

    const invitedUser = this.invitedUserRepository.create({
      user,
      event,
      invitedAt: new Date(),
      status: 'pending',
    });

    return await this.invitedUserRepository.save(invitedUser);
  }

  async isUserRegistered(userId: string, eventId: string): Promise<boolean> {
    console.log('Überprüfe Registrierung für Benutzer:', userId, 'und Event:', eventId);
    const result = await this.invitedUserRepository.query(
      'SELECT COUNT(*) AS count FROM invited_users WHERE userId = ? AND eventId = ?',
      [userId, eventId]
    );
    console.log('Abfrageergebnis:', result);
    return result[0].count > 0;
  }catch (error) {
    console.error('Error executing query:', error);
    throw new Error('Database query failed');
  }

  async unregisterUser(userId: string, eventId: string): Promise<void> {
    await this.invitedUserRepository.query(
      'DELETE FROM invited_users WHERE userId = ? AND eventId = ?',
      [userId, eventId]
    );
  }

}
