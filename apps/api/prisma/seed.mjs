import { PrismaClient, SourcePlatformCode } from '@prisma/client';

const prisma = new PrismaClient();

const nicheKeywords = {
  finanças: ['renda extra', 'investimentos', 'educação financeira', 'economia', 'cartão de crédito'],
  fitness: ['treino em casa', 'hipertrofia', 'emagrecimento', 'nutrição esportiva'],
  motivação: ['mindset', 'disciplina', 'hábitos', 'produtividade'],
  vendas: ['copywriting', 'funil de vendas', 'negociação', 'objeções', 'fechamento'],
  humor: ['memes', 'comédia', 'paródia', 'esquetes'],
  games: ['gameplay', 'dicas', 'lançamentos', 'eSports', 'review']
};

async function main() {
  const platform = await prisma.sourcePlatform.upsert({
    where: { code: SourcePlatformCode.YOUTUBE },
    update: { name: 'YouTube', isActive: true },
    create: {
      code: SourcePlatformCode.YOUTUBE,
      name: 'YouTube',
      isActive: true
    }
  });

  for (const [name, keywords] of Object.entries(nicheKeywords)) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');

    const niche = await prisma.niche.upsert({
      where: { slug },
      update: { name, isActive: true },
      create: {
        slug,
        name,
        isActive: true
      }
    });

    await prisma.keyword.createMany({
      data: keywords.map((term) => ({
        nicheId: niche.id,
        term,
        isActive: true
      })),
      skipDuplicates: true
    });
  }

  console.log(`Seed concluído para plataforma: ${platform.code}`);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
