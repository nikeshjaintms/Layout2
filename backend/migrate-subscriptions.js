const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateExistingUsers() {
  console.log("Fetching existing users...");
  const users = await prisma.user.findMany({
    include: { role: true, subscription: true }
  });

  console.log(`Found ${users.length} users total.`);
  
  for (const user of users) {
    if (user.role?.name === 'CLIENT' && !user.subscription) {
      console.log(`Migrating CLIENT ${user.email} (ID: ${user.id})`);
      
      const now = new Date();
      // Calculate end date (365 days from now)
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 365);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstLoginAt: now, // We assume their migration counts as their first login or equivalent setup.
          subscription: {
            create: {
              startDate: now,
              endDate: endDate,
              durationDays: 365,
              status: 'ACTIVE'
            }
          }
        }
      });
      
      console.log(`Subscription created for ${user.email} (Expires: ${endDate.toISOString()})`);
    } else {
      console.log(`Skipping ${user.email} (Role: ${user.role?.name}, Has Subscription: ${!!user.subscription})`);
    }
  }

  console.log("Migration complete.");
}

migrateExistingUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
