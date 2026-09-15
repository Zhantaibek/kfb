import { seedDatabase } from "../src/db/seed";

seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/db/prisma");
    await prisma.$disconnect();
  });
