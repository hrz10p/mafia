import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Tournament, TournamentStatus } from './tournament.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { GetAllTournamentsQueryDto, GetAllTournamentsResponseDto, TournamentDto } from './dto/get-all-tournaments.dto';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { UserRole } from '../common/enums/roles.enum';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
  ) {}

  async create(createTournamentDto: CreateTournamentDto, currentUser: User): Promise<Tournament> {
    const club = await this.clubsRepository.findOne({ 
      where: { id: createTournamentDto.clubId },
      relations: ['owner', 'administrators']
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    // Проверяем права доступа (владелец, администратор клуба или админ системы)
    if (currentUser.role !== UserRole.ADMIN && 
        club.owner.id !== currentUser.id && 
        !club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для создания турнира');
    }

    const referee = await this.usersRepository.findOne({ 
      where: { id: createTournamentDto.refereeId } 
    });

    if (!referee) {
      throw new NotFoundException('Судья не найден');
    }

    const tournament = this.tournamentsRepository.create({
      ...createTournamentDto,
      club,
      referee,
      date: new Date(createTournamentDto.date),
    });

    return this.tournamentsRepository.save(tournament);
  }

  async findAll(clubId?: number): Promise<Tournament[]> {
    const query = this.tournamentsRepository.createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.club', 'club')
      .leftJoinAndSelect('tournament.referee', 'referee')
      .leftJoinAndSelect('tournament.games', 'games');

    if (clubId) {
      query.where('tournament.club.id = :clubId', { clubId });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Tournament> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: ['club', 'referee', 'games', 'games.players', 'games.players.player'],
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return tournament;
  }

  async update(id: number, updateTournamentDto: UpdateTournamentDto, currentUser: User): Promise<Tournament> {
    const tournament = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        tournament.club.owner.id !== currentUser.id && 
        !tournament.club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для обновления турнира');
    }

    if (updateTournamentDto.refereeId) {
      const referee = await this.usersRepository.findOne({ 
        where: { id: updateTournamentDto.refereeId } 
      });
      if (!referee) {
        throw new NotFoundException('Судья не найден');
      }
      tournament.referee = referee;
    }

    Object.assign(tournament, updateTournamentDto);
    return this.tournamentsRepository.save(tournament);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const tournament = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        tournament.club.owner.id !== currentUser.id && 
        !tournament.club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для удаления турнира');
    }

    await this.tournamentsRepository.remove(tournament);
  }

  async updateStatus(id: number, status: TournamentStatus, currentUser: User): Promise<Tournament> {
    const tournament = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        tournament.club.owner.id !== currentUser.id && 
        !tournament.club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для обновления статуса турнира');
    }

    tournament.status = status;
    return this.tournamentsRepository.save(tournament);
  }

  async getAllTournaments(query: GetAllTournamentsQueryDto): Promise<GetAllTournamentsResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      clubId,
      refereeId,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = query;

    const skip = (page - 1) * limit;

    // Строим условия поиска
    const whereConditions: any = {};
    
    if (search) {
      whereConditions.name = Like(`%${search}%`);
    }
    
    if (status) {
      whereConditions.status = status;
    }

    if (clubId) {
      whereConditions.club = { id: clubId };
    }

    if (refereeId) {
      whereConditions.referee = { id: refereeId };
    }

    // Получаем общее количество турниров
    const total = await this.tournamentsRepository.count({ 
      where: whereConditions,
      relations: clubId ? ['club'] : [],
    });

    // Получаем турниры с пагинацией и сортировкой
    const tournaments = await this.tournamentsRepository.find({
      where: whereConditions,
      relations: ['club', 'referee', 'games'],
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    // Преобразуем в DTO
    const tournamentsDto: TournamentDto[] = tournaments.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      date: tournament.date,
      status: tournament.status,
      clubId: tournament.club.id,
      clubName: tournament.club.name,
      clubLogo: tournament.club.logo,
      refereeId: tournament.referee.id,
      refereeName: tournament.referee.nickname,
      refereeEmail: tournament.referee.email,
      gamesCount: tournament.games?.length || 0,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
    }));

    return {
      tournaments: tournamentsDto,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 