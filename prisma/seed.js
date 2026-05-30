const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL });

async function main() {
  // Add your seed data here. For example:
  // const user = await prisma.users.upsert({
  //   where: { email: 'admin@caresync.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@caresync.com',
  //     first_name: 'Admin',
  //     last_name: 'User',
  //     role: 'admin',
  //     password: 'hashed_password' // ensure you hash passwords in a real app!
  //   },
  // });
  // console.log({ user });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
