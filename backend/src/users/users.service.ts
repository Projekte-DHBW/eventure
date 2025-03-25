import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { User } from 'src/entity/User';
import { EventAttendee } from 'src/entity/EventAttendee';
import { UserProfileDto, UserEventDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EventAttendee)
    private readonly eventAttendeeRepository: Repository<EventAttendee>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async createUser(
    firstName: string,
    lastName: string,
    email: string,
    passwordHash: string,
  ) {
    const userByEmail = await this.findOneByEmail(email);
    if (userByEmail) throw new UnauthorizedException('Email already exists');

    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      passwordHash,
    });
    return await this.userRepository.save(user);
  }

  /**
   * Search for users in a privacy-friendly way
   * - Only exact email matches are returned (partial email searches are not allowed)
   * - For name searches, returns minimal info for display
   * - Results exclude the current user
   */
  async searchUsers(
    query: string,
    type: 'email' | 'name' = 'email',
    currentUserId: string,
  ): Promise<{ id: string; firstName: string; lastName: string }[]> {
    if (!query || query.trim().length < 3) {
      return []; // Require at least 3 characters for search
    }

    let users: User[];

    if (type === 'email') {
      // For email: only exact matches for privacy
      users = await this.userRepository.find({
        where: {
          email: query, // Exact match only
          id: Not(currentUserId), // Exclude current user
        },
        select: ['id', 'firstName', 'lastName'],
      });
    } else {
      // For name search: allow partial matches
      const queryTerms = query.toLowerCase().split(' ').filter(Boolean);

      if (queryTerms.length === 1) {
        // Single term - search in both first and last name
        users = await this.userRepository.find({
          where: [
            {
              firstName: ILike(`%${queryTerms[0]}%`),
              id: Not(currentUserId),
            },
            {
              lastName: ILike(`%${queryTerms[0]}%`),
              id: Not(currentUserId),
            },
          ],
          select: ['id', 'firstName', 'lastName'],
        });
      } else {
        // Multiple terms - try matching first and last name
        users = await this.userRepository.find({
          where: [
            {
              firstName: ILike(`%${queryTerms[0]}%`),
              lastName: ILike(`%${queryTerms[1]}%`),
              id: Not(currentUserId),
            },
            // Also try the reverse order
            {
              firstName: ILike(`%${queryTerms[1]}%`),
              lastName: ILike(`%${queryTerms[0]}%`),
              id: Not(currentUserId),
            },
          ],
          select: ['id', 'firstName', 'lastName'],
        });
      }
    }

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    }));
  }

  /**
   * Invite a user by email
   * If the user exists, we'll return their basic info
   * If not, we'll just send an invitation email (placeholder)
   */
  async inviteByEmail(
    email: string,
    inviterId: string,
    eventId?: string,
    message?: string,
  ): Promise<{
    exists: boolean;
    user?: { id: string; firstName: string; lastName: string };
  }> {
    const user = await this.findOneByEmail(email);

    if (user) {
      // User exists
      return {
        exists: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } else {
      // User doesn't exist, send an invitation email (implementation placeholder)
      // In a real app, you would call your email service here
      console.log(
        `Sending invitation to ${email} from user ${inviterId} for event ${eventId || 'N/A'}`,
      );
      console.log(`Message: ${message || 'No message'}`);

      return { exists: false };
    }
  }

  /**
   * Get a user's public profile by ID
   * Includes past and upcoming events they're attending
   */
  async getUserProfile(id: string): Promise<UserProfileDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'createdAt'],
    });

    if (!user) {
      return null;
    }

    // Get current date for comparing past/future events
    const now = new Date();

    // Find events the user has attended or will attend
    const attendances = await this.eventAttendeeRepository.find({
      where: { userId: id },
      relations: ['event', 'event.occurrences'],
    });

    // Process into past and upcoming events
    const pastEvents: UserEventDto[] = [];
    const upcomingEvents: UserEventDto[] = [];

    attendances.forEach((attendance) => {
      if (!attendance.event) return;

      // Determine if the event is past or upcoming based on occurrence dates
      const event = attendance.event;
      const latestOccurrence =
        event.occurrences && event.occurrences.length > 0
          ? event.occurrences.reduce(
              (latest, current) =>
                current.startDate > latest.startDate ? current : latest,
              event.occurrences[0],
            )
          : null;

      const isUpcoming = latestOccurrence && latestOccurrence.startDate >= now;

      const eventDto: UserEventDto = {
        id: event.id,
        title: event.title,
        startDate: latestOccurrence?.startDate || event.createdAt,
        coverImageUrl: event.coverImageUrl,
        category: event.category,
      };

      if (isUpcoming) {
        upcomingEvents.push(eventDto);
      } else {
        pastEvents.push(eventDto);
      }
    });

    // Sort events by date
    pastEvents.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    upcomingEvents.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePictureUrl: undefined, // You'd need to add this field to your User entity
      joinedDate: user.createdAt,
      pastEvents,
      upcomingEvents,
    };
  }
}
