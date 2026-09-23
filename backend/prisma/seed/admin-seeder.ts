import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin@123',
  name: 'Admin User',
};

async function seedAdmin() {
  try {
    console.log('Starting admin seeder...');

    // Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);

    // Get or create ADMIN role
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator role with full access',
      },
    });

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { email: ADMIN_CREDENTIALS.email },
      update: {
        name: ADMIN_CREDENTIALS.name,
        roleId: adminRole.id,
      },
      create: {
        email: ADMIN_CREDENTIALS.email,
        password: hashedPassword,
        name: ADMIN_CREDENTIALS.name,
        roleId: adminRole.id,
      },
    });

    console.log('Admin user seeded successfully:');
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Password: ${ADMIN_CREDENTIALS.password}`);
    console.log(`  Role: ADMIN`);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
