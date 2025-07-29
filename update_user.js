const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateUserPassword() {
  try {
    const hashedPassword = await bcrypt.hash('Test123@', 10);
    
    const user = await prisma.user.update({
      where: { email: 'apizarrocotes@outlook.es' },
      data: {
        password: hashedPassword,
      },
    });
    
    console.log('User password updated:', user.email);
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPassword();