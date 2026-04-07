const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const emailAdmin = 'admin@petplus.com.br';
  const senhaAdmin = 'admin123petplus';           

  const hashedPassword = await bcrypt.hash(senhaAdmin, 10);

  const admin = await prisma.user.upsert({
    where: { email: emailAdmin },
    update: {},
    create: {
      email: emailAdmin,
      password_hash: hashedPassword,
      full_name: 'Administrador Sistema',
      role_id: 1,
      terms_accepted: true,
    },
  });

  console.log('👑 Conta ADMIN criada com sucesso!');
  console.log(`E-mail: ${admin.email}`);
  console.log(`Senha: ${senhaAdmin}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());