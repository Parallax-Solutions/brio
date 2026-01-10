import { PrismaClient, Currency, IncomeCadence, PaymentCadence } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create dev user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      email: 'dev@example.com',
      passwordHash: hashedPassword,
      name: 'Dev User',
      baseCurrency: Currency.CRC,
      theme: 'SYSTEM',
      accentColor: 'blue',
      locale: 'es',
    },
  });

  console.log('✅ Created dev user:', user.email);

  // Create initial income source
  const income = await prisma.income.create({
    data: {
      userId: user.id,
      name: 'Main Income',
      amount: 350000, // $3,500.00 USD in cents
      currency: Currency.USD,
      cadence: IncomeCadence.MONTHLY,
      active: true,
    },
  });

  console.log('✅ Created income source:', income.name);

  // Create exchange rates
  await prisma.exchangeRate.create({
    data: {
      userId: user.id,
      fromCurrency: Currency.USD,
      toCurrency: Currency.CRC,
      rate: 525.5, // 1 USD = 525.5 CRC
      effectiveDate: new Date(),
      source: 'manual',
    },
  });

  await prisma.exchangeRate.create({
    data: {
      userId: user.id,
      fromCurrency: Currency.CAD,
      toCurrency: Currency.CRC,
      rate: 385.2, // 1 CAD = 385.2 CRC (example)
      effectiveDate: new Date(),
      source: 'manual',
    },
  });

  console.log('✅ Created exchange rates');

  // Create sample recurring payments
  await prisma.recurringPayment.create({
    data: {
      userId: user.id,
      name: 'Rent',
      category: 'Housing',
      amount: 500000, // ₡500,000 CRC
      currency: Currency.CRC,
      cadence: PaymentCadence.MONTHLY,
      dueDay: 1,
      active: true,
    },
  });

  await prisma.recurringPayment.create({
    data: {
      userId: user.id,
      name: 'Phone Bill (CAD)',
      category: 'Utilities',
      amount: 7500, // $75.00 CAD in cents
      currency: Currency.CAD,
      cadence: PaymentCadence.MONTHLY,
      dueDay: 15,
      active: true,
    },
  });

  console.log('✅ Created recurring payments');

  // Create sample subscriptions
  await prisma.subscription.create({
    data: {
      userId: user.id,
      name: 'Netflix',
      amount: 1599, // $15.99 USD in cents
      currency: Currency.USD,
      cadence: PaymentCadence.MONTHLY,
      dueDay: 5,
      active: true,
    },
  });

  console.log('✅ Created subscriptions');

  // Create variable bill types
  await prisma.variableBillType.create({
    data: {
      userId: user.id,
      name: 'Water',
      category: 'Utilities',
      currency: Currency.CRC,
    },
  });

  await prisma.variableBillType.create({
    data: {
      userId: user.id,
      name: 'Power',
      category: 'Utilities',
      currency: Currency.CRC,
    },
  });

  console.log('✅ Created variable bill types');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


