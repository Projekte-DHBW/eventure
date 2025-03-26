import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Event } from '../entity/Event';
import { EventLocation } from '../entity/EventLocation';
import { EventOccurrence } from '../entity/EventOccurrence';
import { Invitation } from '../entity/Invitation';
import { User } from 'src/entity/User';
import { CreateEventDto, EventLocationDto } from './dto/CreateEvent';
import { EventFiltersDto } from './dto/EventFilters';
import { UpdateEventDto } from './dto/UpdateEvent';
import { EventAttendee } from '../entity/EventAttendee';
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
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(EventAttendee)
    private eventAttendeeRepository: Repository<EventAttendee>,
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

      // Fixed: Use the entity reference instead of just IDs
      const occurrence = this.eventOccurrenceRepository.create({
        event: event, // Use entity reference instead of ID
        startDate: occurrenceDto.startDate,
        endDate: occurrenceDto.endDate,
        // Use optional chaining for locationDetails to handle null values
        ...(locationEntity ? { locationDetails: locationEntity } : {}),
      });

      // Set the eventId field separately after creation
      occurrence.eventId = event.id;

      // Set locationId if available
      if (locationEntity) {
        occurrence.locationId = locationEntity.id;
      }

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
      relations: ['locationDetails'],
      order: { startDate: 'ASC' },
    });
    // Find all invitations
    const invitations = await this.invitationRepository.find({
      where: { event: { id } },
    });

    // Count attendees
    const attendeeCount = await this.eventAttendeeRepository.count({
      where: { eventId: id },
    });

    // Extract creator name from creatorObj
    const creatorName = event.creatorObj
      ? `${event.creatorObj.firstName} ${event.creatorObj.lastName}`
      : 'Unknown';

    // Attach all related entities and additional properties to the event
    const eventWithDetails = {
      ...event,
      occurrences,
      invitations,
      attendeeCount,
      creatorName,
    };

    return eventWithDetails as Event;
  }

  async findAll(filters: EventFiltersDto): Promise<[Event[], number]> {
    try {
      const {
        search,
        types,
        category,
        sort = 'newest',
        page = 1,
        limit = 20,
        date,
        attending,
        userId,
        locations,
      } = filters;

      // Erstellen der Basisabfrage für Events
      let query = this.eventRepository
        .createQueryBuilder('event')
        .where('event.visibility = :visibility', { visibility: 'public' });

      // Falls nach Teilnahme gefiltert wird, mit Teilnehmern joinen
      if (attending && userId) {
        query = query
          .innerJoin(
            'event_attendee',
            'attendee',
            'attendee.eventId = event.id',
          )
          .andWhere('attendee.userId = :userId', { userId });
      }

      // Textsuche (Titel, Beschreibung, Ort)
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        query.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(event.title) LIKE LOWER(:search)', {
              search: searchTerm,
            })
              .orWhere('LOWER(event.description) LIKE LOWER(:search)', {
                search: searchTerm,
              })
              .orWhere('LOWER(event.location) LIKE LOWER(:search)', {
                search: searchTerm,
              });
          }),
        );
      }

      // Kategoriefilterung - unterstützt sowohl einzelne Kategorie als auch Array
      if (category) {
        query.andWhere('event.category = :category', { category });
      } else if (types && types.length > 0) {
        query.andWhere('event.category IN (:...types)', { types });
      }

      // Standortfilterung
      if (locations && Array.isArray(locations) && locations.length > 0) {
        query.andWhere('event.location IN (:...locations)', { locations });
      }

      // Datumfilterung
      if (date) {
        // Join mit den Event-Vorkommen
        query = query.leftJoin('event.occurrences', 'occurrence');

        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        let startDate: Date;
        let endDate: Date;

        // Datum-Bereiche basierend auf dem Filter setzen
        switch (date) {
          case 'today': // Heute
            startDate = today;
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            break;

          case 'tomorrow': // Morgen
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() + 1);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;

          case 'this_week': // Diese Woche
            startDate = today;
            endDate = new Date(today);
            const dayOfWeek = endDate.getDay();
            const daysUntilEndOfWeek = 6 - dayOfWeek; // 6 = Samstag (Sonntag = 0)
            endDate.setDate(endDate.getDate() + daysUntilEndOfWeek);
            endDate.setHours(23, 59, 59, 999);
            break;

          case 'this_month': // Diesen Monat
            startDate = today;
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;

          case 'this_year': // Dieses Jahr
            startDate = today;
            endDate = new Date(today.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;

          default:
            // Spezifisches Datum im Format YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
              startDate = new Date(date);
              endDate = new Date(date);
              endDate.setHours(23, 59, 59, 999);
            } else {
              // Standardmäßig auf heute setzen, wenn das Format nicht erkannt wird
              startDate = today;
              endDate = new Date(today);
              endDate.setHours(23, 59, 59, 999);
            }
        }

        // Sichereren Abfrageansatz verwenden
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
                '(occurrence.startDate <= :startDate AND occurrence.endDate >= :startDate)',
                {
                  startDate,
                },
              );
          }),
        );
      }

      // Sortierung anwenden
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

      // Paginierung anwenden
      query.skip((page - 1) * limit).take(limit);

      // Wichtige Felder auswählen
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

      // Abfrage eindeutig machen, um Duplikate zu vermeiden
      query.distinct(true);

      // Gleiche Abfrage für die Gesamtzahl verwenden, aber count statt select
      const countQuery = query.clone();
      countQuery
        .skip(undefined)
        .take(undefined)
        .select('COUNT(DISTINCT event.id)', 'count');

      // Alle Abfragen parallel ausführen für bessere Performance
      const [events, totalResult] = await Promise.all([
        query.getMany(),
        countQuery.getRawOne(),
      ]);

      const total = parseInt(totalResult?.count || '0', 10);

      return [events, total];
    } catch (error) {
      console.error('Fehler beim Suchen von Events:', error);
      return [[], 0]; // Leeres Ergebnis im Fehlerfall zurückgeben
    }
  }

  async findOneById(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['occurrences'], // Stellen Sie sicher, dass occurrences geladen werden
    });

    if (!event) {
      throw new NotFoundException(`Event mit ID ${id} nicht gefunden`);
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

    // Extract only direct Event properties for the update
    const { occurrences, invitations, removeOccurrences, ...directEventProps } =
      updateEventDto;

    // Update only the direct properties of the event
    await this.eventRepository.update(id, directEventProps);

    // Handle occurrences if provided
    if (occurrences && occurrences.length > 0) {
      await this.updateEventOccurrences(event, occurrences);
    }

    // Handle invitation updates if provided
    if (invitations && invitations.length > 0) {
      // Implement this method similar to createInvitations
      // await this.updateInvitations(event, invitations);
    }

    // Handle occurrence removal if needed
    if (removeOccurrences && removeOccurrences.length > 0) {
      await this.eventOccurrenceRepository.delete({
        id: In(removeOccurrences),
        eventId: event.id,
      });
    }

    return this.findOne(id);
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
    try {
      if (!query || query.trim().length < 2) {
        return []; // Mindestens 2 Zeichen für die Suche erforderlich
      }

      // Abfrage des Standortfelds direkt aus der Event-Tabelle
      const results = await this.eventRepository
        .createQueryBuilder('event')
        .where('LOWER(event.location) LIKE LOWER(:query)', {
          query: `%${query.trim()}%`,
        })
        .select('event.location', 'location')
        .distinct(true)
        .orderBy('event.location', 'ASC') // Alphabetische Sortierung
        .limit(limit)
        .getRawMany();

      // Extrahieren der Standortwerte aus den Ergebnissen
      const locations = results
        .map((result) => result.location)
        .filter(
          (location) =>
            location !== null &&
            location !== undefined &&
            location.trim() !== '',
        );

      return locations;
    } catch (error) {
      console.error('Fehler bei der Städtesuche:', error);
      return [];
    }
  }

  async inviteUser(userId: string, eventId: string): Promise<InvitedUsers> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

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
    console.log(
      'Überprüfe Registrierung für Benutzer:',
      userId,
      'und Event:',
      eventId,
    );
    const result = await this.invitedUserRepository.query(
      'SELECT COUNT(*) AS count FROM invited_users WHERE userId = ? AND eventId = ?',
      [userId, eventId],
    );
    console.log('Abfrageergebnis:', result);
    return result[0].count > 0;
  }
  catch(error) {
    console.error('Error executing query:', error);
    throw new Error('Database query failed');
  }

  async unregisterUser(userId: string, eventId: string): Promise<void> {
    await this.invitedUserRepository.query(
      'DELETE FROM invited_users WHERE userId = ? AND eventId = ?',
      [userId, eventId],
    );
  }

  /**
   * Find events that a user is attending
   */
  async findAttendingEvents(userId: string): Promise<Event[]> {
    const attendeeRecords = await this.eventAttendeeRepository.find({
      where: { userId },
      relations: ['event'],
    });

    // Extract the events from the attendee records
    return attendeeRecords.map((record) => record.event);
  }

  /**
   * Add a user as an attendee to an event
   */
  async addAttendee(eventId: string, userId: string): Promise<void> {
    // Check if the event exists
    const event = await this.findOneById(eventId);

    // Check if user is already attending
    const existing = await this.eventAttendeeRepository.findOne({
      where: { eventId, userId },
    });

    if (!existing) {
      const attendee = this.eventAttendeeRepository.create({
        eventId,
        userId,
        status: 'confirmed',
      });

      await this.eventAttendeeRepository.save(attendee);
    }
  }

  /**
   * Remove a user as an attendee from an event
   */
  async removeAttendee(eventId: string, userId: string): Promise<void> {
    await this.eventAttendeeRepository.delete({
      eventId,
      userId,
    });
  }

  // Add this new method
  private async updateEventOccurrences(
    event: Event,
    occurrences: UpdateEventDto['occurrences'],
  ): Promise<void> {
    if (!occurrences || occurrences.length === 0) return;

    const occurrencePromises = occurrences.map(async (occurrenceDto) => {
      let occurrence: EventOccurrence;

      // If there's an ID, update existing occurrence
      if (occurrenceDto.id) {
        const foundOccurrence = await this.eventOccurrenceRepository.findOne({
          where: {
            id: occurrenceDto.id,
            eventId: event.id,
          },
        });

        if (!foundOccurrence) {
          throw new NotFoundException(
            `Occurrence with ID ${occurrenceDto.id} not found`,
          );
        }

        occurrence = foundOccurrence;

        // Update fields
        occurrence.startDate = occurrenceDto.startDate;
        if (occurrenceDto.endDate) occurrence.endDate = occurrenceDto.endDate;
        if (occurrenceDto.title) occurrence.title = occurrenceDto.title;

        // Handle location if provided
        if (occurrenceDto.location) {
          const locationEntity = await this.createEventLocation(
            occurrenceDto.location,
          );
          occurrence.locationDetails = locationEntity;
          occurrence.locationId = locationEntity.id;
        }
      } else {
        // Create a new occurrence
        // Create location if provided
        let locationEntity: EventLocation | null = null;
        if (occurrenceDto.location) {
          locationEntity = await this.createEventLocation(
            occurrenceDto.location,
          );
        }

        // Create new occurrence
        occurrence = this.eventOccurrenceRepository.create({
          event: event,
          startDate: occurrenceDto.startDate,
          endDate: occurrenceDto.endDate,
          title: occurrenceDto.title,
        });

        occurrence.eventId = event.id;

        if (locationEntity) {
          occurrence.locationDetails = locationEntity;
          occurrence.locationId = locationEntity.id;
        }
      }

      return this.eventOccurrenceRepository.save(occurrence);
    });

    await Promise.all(occurrencePromises);
  }
}
