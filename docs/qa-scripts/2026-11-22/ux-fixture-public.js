// Completa perfis públicos no banco local descartável.
const B = 'C:/PI - 2026/Pet/backend';
const prisma = require(B + '/src/config/database');
const fx = require('./ux-accounts.json');
(async () => {
  if (!/(localhost|127\.0\.0\.1):55432\/petplus_dev_test/.test(process.env.DATABASE_URL)) throw Error('banco inesperado');
  for (const [id, roles] of [[fx.ids.hotel, undefined], [fx.ids.sitter, ['SITTING', 'WALKING']]]) {
    await prisma.provider.update({ where: { id }, data: { description: 'Perfil fictício para auditoria visual do Pet+.', phone: '11999990000', city: 'São Paulo', state: 'SP', zip_code: '01001000',
      gallery_images: ['http://localhost:5173/icon.png'], ...(roles ? { sitter_roles: roles } : {}) } });
  }
  console.log('ok');
  await prisma.$disconnect();
})().catch(e => { console.error(e.message); process.exitCode = 1; });
