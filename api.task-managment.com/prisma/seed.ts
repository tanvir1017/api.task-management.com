import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const defaultPassword = 'password123';
  const hashedPassword = await hash(defaultPassword, 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      username: 'admin',
      fullName: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      fullName: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      username: 'user',
      fullName: 'Normal User',
      password: hashedPassword,
      role: UserRole.USER,
      isActive: true,
    },
    create: {
      email: 'user@example.com',
      username: 'user',
      fullName: 'Normal User',
      password: hashedPassword,
      role: UserRole.USER,
      isActive: true,
    },
  });
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
