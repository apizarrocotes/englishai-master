const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('Test123@', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'apizarrocotes@outlook.es',
        password: hashedPassword,
        name: 'Test User',
        subscriptionTier: 'free',
        avatarUrl: null,
      },
    });
    
    console.log('Test user created:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();