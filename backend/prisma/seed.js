const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { id: 1, name: 'ADMIN', description: 'Administrador do Sistema' },
      { id: 2, name: 'LOJISTA', description: 'Parceiro Lojista' },
      { id: 3, name: 'HOTEL', description: 'Parceiro Hotel Pet' },
      { id: 4, name: 'PET_SITTER', description: 'Parceiro Pet Sitter' },
      { id: 5, name: 'TUTOR', description: 'Usuário Padrão (Tutor)' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Tabela de Roles populada com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });