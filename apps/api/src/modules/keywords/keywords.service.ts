import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Keyword, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { ListKeywordsQueryDto } from './dto/list-keywords-query.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';
import { buildKeywordListWhere, buildPaginationMeta } from './services/keywords-query.logic';

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
export class KeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListKeywordsQueryDto): Promise<PaginatedResult<Keyword>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.KeywordWhereInput = buildKeywordListWhere({
      nicheId: query.nicheId,
      search: query.search
    });

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

  async getById(id: string): Promise<Keyword> {
    const keyword = await this.prisma.keyword.findUnique({ where: { id } });

    if (!keyword) {
      throw new NotFoundException('Palavra-chave não encontrada.');
    }

    return keyword;
  }

  async create(input: CreateKeywordDto): Promise<Keyword> {
    await this.ensureNicheExists(input.nicheId);

    await this.ensureUniqueTerm(input.nicheId, input.term);

    return this.prisma.keyword.create({
      data: {
        nicheId: input.nicheId,
        term: input.term,
        isActive: input.isActive ?? true
      }
    });
  }

  async update(id: string, input: UpdateKeywordDto): Promise<Keyword> {
    const current = await this.getById(id);

    const nicheId = input.nicheId ?? current.nicheId;
    const term = input.term ?? current.term;

    if (input.nicheId) {
      await this.ensureNicheExists(input.nicheId);
    }

    await this.ensureUniqueTerm(nicheId, term, id);

    return this.prisma.keyword.update({
      where: { id },
      data: {
        nicheId: input.nicheId,
        term: input.term,
        isActive: input.isActive
      }
    });
  }

  async delete(id: string): Promise<{ message: string }> {
    await this.getById(id);

    await this.prisma.keyword.delete({ where: { id } });

    return { message: 'Palavra-chave removida com sucesso.' };
  }

  private async ensureNicheExists(nicheId: string): Promise<void> {
    const niche = await this.prisma.niche.findUnique({ where: { id: nicheId } });
    if (!niche) {
      throw new NotFoundException('Nicho informado não existe.');
    }
  }

  private async ensureUniqueTerm(
    nicheId: string,
    term: string,
    currentKeywordId?: string
  ): Promise<void> {
    const duplicate = await this.prisma.keyword.findFirst({
      where: {
        nicheId,
        term,
        ...(currentKeywordId ? { id: { not: currentKeywordId } } : {})
      }
    });

    if (duplicate) {
      throw new ConflictException(
        'Já existe esta palavra-chave para o nicho informado.'
      );
    }
  }
}
