import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Keyword, Niche, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify.util';
import { ListKeywordsQueryDto } from '../keywords/dto/list-keywords-query.dto';
import { CreateNicheDto } from './dto/create-niche.dto';
import { ListNichesQueryDto } from './dto/list-niches-query.dto';
import { UpdateNicheDto } from './dto/update-niche.dto';
import {
  buildKeywordsByNicheWhere,
  buildNicheListWhere,
  buildPaginationMeta
} from './services/niches-query.logic';

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

@Injectable()
export class NichesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListNichesQueryDto): Promise<PaginatedResult<Niche>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.NicheWhereInput = buildNicheListWhere(query.search);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.niche.count({ where }),
      this.prisma.niche.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, pageSize)
    };
  }

  async getById(id: string): Promise<Niche> {
    const niche = await this.prisma.niche.findUnique({ where: { id } });

    if (!niche) {
      throw new NotFoundException('Nicho não encontrado.');
    }

    return niche;
  }

  async create(input: CreateNicheDto): Promise<Niche> {
    const slug = slugify(input.name);

    const existing = await this.prisma.niche.findFirst({
      where: {
        OR: [{ name: input.name }, { slug }]
      }
    });

    if (existing) {
      throw new ConflictException('Já existe um nicho com este nome.');
    }

    return this.prisma.niche.create({
      data: {
        name: input.name,
        slug,
        isActive: input.isActive ?? true
      }
    });
  }

  async update(id: string, input: UpdateNicheDto): Promise<Niche> {
    await this.getById(id);

    let slug: string | undefined;
    if (input.name) {
      slug = slugify(input.name);
      const duplicate = await this.prisma.niche.findFirst({
        where: {
          id: { not: id },
          OR: [{ name: input.name }, { slug }]
        }
      });

      if (duplicate) {
        throw new ConflictException('Já existe um nicho com este nome.');
      }
    }

    return this.prisma.niche.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        isActive: input.isActive
      }
    });
  }

  async delete(id: string): Promise<{ message: string }> {
    await this.getById(id);

    await this.prisma.niche.delete({ where: { id } });

    return { message: 'Nicho removido com sucesso.' };
  }

  async listKeywordsByNiche(
    nicheId: string,
    query: ListKeywordsQueryDto
  ): Promise<PaginatedResult<Keyword>> {
    await this.getById(nicheId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.KeywordWhereInput = buildKeywordsByNicheWhere(nicheId, query.search);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.keyword.count({ where }),
      this.prisma.keyword.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, pageSize)
    };
  }
}
