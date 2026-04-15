const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    
    const passwordHash = await bcrypt.hash('admin123petplus', 10);

    const adminRole = await prisma.role.findFirst({
      where: { name: 'ADMIN' } 
    });

    if (!adminRole) {
      console.log("Cargo de Admin não encontrado. Verifique se o seed.js rodou corretamente.");
      return;
    }

    const admin = await prisma.user.create({
      data: {
        full_name: "Administrador Pet+",
        email: "admin@petplus.com",
        password_hash: passwordHash,
        role_id: adminRole.id 
      }
    });

    console.log("Conta ADMIN criada com sucesso!");
    console.log(`Email: ${admin.email}`);
    
  } catch (error) {
    console.error("Erro ao criar admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();