import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Season, SeasonStatus } from './season.entity';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { GetSeasonsDto, SeasonResponseDto } from './dto';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { UserRole } from '../common/enums/roles.enum';

@Injectable()
export class SeasonsService {
  constructor(
    @InjectRepository(Season)
    private seasonsRepository: Repository<Season>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
  ) {}

  async create(createSeasonDto: CreateSeasonDto, currentUser: User): Promise<Season> {
    const club = await this.clubsRepository.findOne({ 
      where: { id: createSeasonDto.clubId },
      relations: ['owner', 'administrators']
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    // Проверяем права доступа (владелец, администратор клуба или админ системы)
    if (currentUser.role !== UserRole.ADMIN && 
        club.owner.id !== currentUser.id && 
        !club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для создания сезона');
    }

    const referee = await this.usersRepository.findOne({ 
      where: { id: createSeasonDto.refereeId } 
    });

    if (!referee) {
      throw new NotFoundException('Судья не найден');
    }

    const season = this.seasonsRepository.create({
      ...createSeasonDto,
      club,
      referee,
      startDate: new Date(createSeasonDto.startDate),
      endDate: new Date(createSeasonDto.endDate),
    });

    return this.seasonsRepository.save(season);
  }

  async findAll(clubId?: number): Promise<Season[]> {
    const query = this.seasonsRepository.createQueryBuilder('season')
      .leftJoinAndSelect('season.club', 'club')
      .leftJoinAndSelect('season.referee', 'referee')
      .leftJoinAndSelect('season.games', 'games');

    if (clubId) {
      query.where('season.club.id = :clubId', { clubId });
    }

    return query.getMany();
  }

  async getAllSeasons(query: GetSeasonsDto): Promise<SeasonResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      clubId,
      refereeId,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = query;

    const queryBuilder = this.seasonsRepository.createQueryBuilder('season')
      .leftJoinAndSelect('season.club', 'club')
      .leftJoinAndSelect('season.referee', 'referee')
      .leftJoinAndSelect('season.games', 'games');

    // Поиск по названию
    if (search) {
      queryBuilder.andWhere('season.name ILIKE :search', { search: `%${search}%` });
    }

    // Фильтр по статусу
    if (status) {
      queryBuilder.andWhere('season.status = :status', { status });
    }

    // Фильтр по клубу
    if (clubId) {
      queryBuilder.andWhere('season.club.id = :clubId', { clubId });
    }

    // Фильтр по судье
    if (refereeId) {
      queryBuilder.andWhere('season.referee.id = :refereeId', { refereeId });
    }

    // Сортировка
    const allowedSortFields = ['id', 'name', 'startDate', 'endDate', 'status', 'createdAt', 'updatedAt'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`season.${finalSortBy}`, sortOrder);

    // Подсчет общего количества
    const total = await queryBuilder.getCount();

    // Пагинация
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const seasons = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      seasons,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    };
  }

  async findOne(id: number): Promise<Season> {
    const season = await this.seasonsRepository.findOne({
      where: { id },
      relations: ['club', 'referee', 'games', 'games.players', 'games.players.player'],
    });

    if (!season) {
      throw new NotFoundException('Сезон не найден');
    }

    return season;
  }

  async update(id: number, updateSeasonDto: UpdateSeasonDto, currentUser: User): Promise<Season> {
    const season = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        season.club.owner.id !== currentUser.id && 
        !season.club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для обновления сезона');
    }

    if (updateSeasonDto.refereeId) {
      const referee = await this.usersRepository.findOne({ 
        where: { id: updateSeasonDto.refereeId } 
      });
      if (!referee) {
        throw new NotFoundException('Судья не найден');
      }
      season.referee = referee;
    }

    Object.assign(season, updateSeasonDto);
    return this.seasonsRepository.save(season);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const season = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        season.club.owner.id !== currentUser.id && 
        !season.club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для удаления сезона');
    }

    await this.seasonsRepository.remove(season);
  }

  async updateStatus(id: number, status: SeasonStatus, currentUser: User): Promise<Season> {
    const season = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        season.club.owner.id !== currentUser.id && 
        !season.club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для обновления статуса сезона');
    }

    season.status = status;
    return this.seasonsRepository.save(season);
  }
} 