import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  // Dashboard
  { action: 'sidebar', subject: 'dashboard', description: 'Can view dashboard sidebar' },
  { action: 'read', subject: 'dashboard', description: 'Can read dashboard' },
  // Users
  { action: 'sidebar', subject: 'user', description: 'Can view users sidebar' },
  { action: 'read', subject: 'user', description: 'Can read users' },
  { action: 'show', subject: 'user', description: 'Can show user details' },
  { action: 'create', subject: 'user', description: 'Can create users' },
  { action: 'edit', subject: 'user', description: 'Can edit users' },
  { action: 'delete', subject: 'user', description: 'Can delete users' },
  // Roles
  { action: 'sidebar', subject: 'role', description: 'Can view roles sidebar' },
  { action: 'read', subject: 'role', description: 'Can read roles' },
  { action: 'show', subject: 'role', description: 'Can show role details' },
  { action: 'create', subject: 'role', description: 'Can create roles' },
  { action: 'edit', subject: 'role', description: 'Can edit roles' },
  { action: 'delete', subject: 'role', description: 'Can delete roles' },
  // Projects
  { action: 'sidebar', subject: 'project', description: 'Can view projects sidebar' },
  { action: 'read', subject: 'project', description: 'Can read projects' },
  { action: 'show', subject: 'project', description: 'Can show project details' },
  { action: 'create', subject: 'project', description: 'Can create projects' },
  { action: 'edit', subject: 'project', description: 'Can edit projects' },
  { action: 'delete', subject: 'project', description: 'Can delete projects' },
  // Plots
  { action: 'sidebar', subject: 'plot', description: 'Can view plots sidebar' },
  { action: 'read', subject: 'plot', description: 'Can read plots' },
  { action: 'show', subject: 'plot', description: 'Can show plot details' },
  { action: 'create', subject: 'plot', description: 'Can create plots' },
  { action: 'edit', subject: 'plot', description: 'Can edit plots' },
  { action: 'delete', subject: 'plot', description: 'Can delete plots' },
  { action: 'bulk-create', subject: 'plot', description: 'Can bulk create plots' },
  { action: 'assign', subject: 'plot', description: 'Can assign plots' },
  // Gallery
  { action: 'sidebar', subject: 'gallery', description: 'Can view gallery sidebar' },
  { action: 'read', subject: 'gallery', description: 'Can read galleries' },
  { action: 'show', subject: 'gallery', description: 'Can show gallery details' },
  { action: 'create', subject: 'gallery', description: 'Can create galleries' },
  { action: 'edit', subject: 'gallery', description: 'Can edit galleries' },
  { action: 'delete', subject: 'gallery', description: 'Can delete galleries' },
  { action: 'upload', subject: 'gallery', description: 'Can upload gallery images' },
  // Amenities
  { action: 'sidebar', subject: 'amenity', description: 'Can view amenities sidebar' },
  { action: 'read', subject: 'amenity', description: 'Can read amenities' },
  { action: 'show', subject: 'amenity', description: 'Can show amenity details' },
  { action: 'create', subject: 'amenity', description: 'Can create amenities' },
  { action: 'edit', subject: 'amenity', description: 'Can edit amenities' },
  { action: 'delete', subject: 'amenity', description: 'Can delete amenities' },
  { action: 'upload', subject: 'amenity', description: 'Can upload amenity icon' },
  // Plot Statuses
  { action: 'read', subject: 'status', description: 'Can read statuses' },
  { action: 'show', subject: 'status', description: 'Can show status details' },
  { action: 'create', subject: 'status', description: 'Can create statuses' },
  { action: 'edit', subject: 'status', description: 'Can edit statuses' },
  { action: 'delete', subject: 'status', description: 'Can delete statuses' },
  // Plot Appearance
  { action: 'read', subject: 'appearance', description: 'Can read appearances' },
  { action: 'edit', subject: 'appearance', description: 'Can edit appearances' },
  // Boundaries
  { action: 'read', subject: 'boundary', description: 'Can read boundaries' },
  { action: 'create', subject: 'boundary', description: 'Can create boundaries' },
  { action: 'edit', subject: 'boundary', description: 'Can edit boundaries' },
  { action: 'delete', subject: 'boundary', description: 'Can delete boundaries' },
  // CAD Conversions
  { action: 'read', subject: 'conversion', description: 'Can read CAD conversions' },
  { action: 'create', subject: 'conversion', description: 'Can create CAD conversions' },
  { action: 'edit', subject: 'conversion', description: 'Can edit CAD conversions' },
  { action: 'delete', subject: 'conversion', description: 'Can delete CAD conversions' },
  { action: 'upload', subject: 'conversion', description: 'Can upload CAD files' },
];

const CLIENT_PERMISSIONS = [
  'read-project', 'show-project', 'sidebar-project',
  'read-plot', 'show-plot', 'sidebar-plot',
  'read-gallery', 'show-gallery', 'sidebar-gallery',
  'read-status', 'show-status',
  'read-appearance',
  'read-amenity', 'show-amenity', 'sidebar-amenity',
  'read-boundary',
  'read-conversion'
];

async function main() {
  console.log('Starting seed...');

  // 1. Seed Permissions
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        action_subject: { action: perm.action, subject: perm.subject },
      },
      update: { description: perm.description },
      create: perm,
    });
  }

  // Fetch all permissions from DB to get their IDs
  const allDbPermissions = await prisma.permission.findMany();

  // 2. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator role with full access' },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: { name: 'CLIENT', description: 'Client role with limited access' },
  });

  // 3. Assign Permissions to ADMIN (All)
  for (const perm of allDbPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // 4. Assign Permissions to CLIENT (Subset)
  for (const permStr of CLIENT_PERMISSIONS) {
    // Split by the hyphen
    const [action, ...rest] = permStr.split('-');
    const subject = rest.join('-'); // Just in case subject has hyphens, though ours don't
    
    const perm = allDbPermissions.find((p) => p.action === action && p.subject === subject);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: clientRole.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: clientRole.id, permissionId: perm.id },
      });
    }
  }

  // 5. Seed Users
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const clientPassword = await bcrypt.hash('Client@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      roleId: adminRole.id,
    },
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {
      roleId: clientRole.id,
    },
    create: {
      email: 'client@example.com',
      password: clientPassword,
      roleId: clientRole.id,
    },
  });

  console.log('Admin user:', admin.email);
  console.log('Client user:', client.email);
  console.log('RBAC Seeding and Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
