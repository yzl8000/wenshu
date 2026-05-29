import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin account
  const adminEmail = 'admin@wenshu.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('admin123', 10),
        name: '管理员',
        balance: 999999,
        referralCode: 'WXADMIN1',
      },
    });
    console.log('Created admin account: admin@wenshu.com / admin123');
  }

  // Delete existing templates and recreate
  await prisma.resumeTemplate.deleteMany();

  await prisma.resumeTemplate.createMany({
    data: [
      {
        name: '简洁专业',
        thumbnail: null,
        configJson: JSON.stringify({
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: 14,
          primaryColor: '#2c3e50',
          secondaryColor: '#7f8c8d',
          accentColor: '#2980b9',
          layout: 'single-column',
          margin: 20,
        }),
      },
      {
        name: '现代双栏',
        thumbnail: null,
        configJson: JSON.stringify({
          fontFamily: '"Helvetica Neue", Arial, sans-serif',
          fontSize: 13,
          primaryColor: '#1a1a2e',
          secondaryColor: '#16213e',
          accentColor: '#e94560',
          layout: 'two-column',
          margin: 16,
          sidebarWidth: '30%',
        }),
      },
      {
        name: '经典学术',
        thumbnail: null,
        configJson: JSON.stringify({
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 12,
          primaryColor: '#333333',
          secondaryColor: '#555555',
          accentColor: '#8b0000',
          layout: 'single-column',
          margin: 25,
        }),
      },
      {
        name: '极简清新',
        thumbnail: null,
        configJson: JSON.stringify({
          fontFamily: '"Segoe UI", Roboto, sans-serif',
          fontSize: 13,
          primaryColor: '#2d3436',
          secondaryColor: '#636e72',
          accentColor: '#00b894',
          layout: 'single-column',
          margin: 22,
        }),
      },
    ],
  });

  console.log('Seeded 4 resume templates');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
