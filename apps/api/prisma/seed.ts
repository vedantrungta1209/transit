import { PrismaClient, VehicleType, BillingCycle, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@transitco.in' },
    update: {},
    create: {
      email: 'admin@transitco.in',
      passwordHash: await bcrypt.hash('Admin@123!', 12),
      name: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
    },
  });

  const cityAdmin = await prisma.adminUser.upsert({
    where: { email: 'bangalore@transitco.in' },
    update: {},
    create: {
      email: 'bangalore@transitco.in',
      passwordHash: await bcrypt.hash('Blr@123!', 12),
      name: 'Bangalore City Admin',
      role: AdminRole.CITY_ADMIN,
    },
  });

  // Fare rules for Bangalore
  const fareRules = [
    { city: 'Bangalore', vehicleType: VehicleType.AUTO, baseFare: 30, perKmRate: 12, perMinRate: 1.5, minimumFare: 40 },
    { city: 'Bangalore', vehicleType: VehicleType.CAB, baseFare: 50, perKmRate: 16, perMinRate: 2, minimumFare: 70 },
    { city: 'Bangalore', vehicleType: VehicleType.EV_CAB, baseFare: 45, perKmRate: 14, perMinRate: 1.8, minimumFare: 65 },
    { city: 'Bangalore', vehicleType: VehicleType.BIKE, baseFare: 20, perKmRate: 8, perMinRate: 1, minimumFare: 25 },
  ];

  for (const rule of fareRules) {
    await prisma.farePricingRule.upsert({
      where: { city_vehicleType: { city: rule.city, vehicleType: rule.vehicleType } },
      update: {},
      create: { ...rule, minimumFare: rule.minimumFare },
    });
  }

  // Subscription plans
  await prisma.subscriptionPlan.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'plan_weekly_auto_blr',
        name: 'Bangalore Weekly Auto',
        description: 'Weekly subscription for auto drivers in Bangalore',
        city: 'Bangalore',
        vehicleType: VehicleType.AUTO,
        billingCycle: BillingCycle.WEEKLY,
        basePrice: 199,
        peakHoursDiscount: 0.10,
        offPeakDiscount: 0.20,
        peakHoursStart: '06:00',
        peakHoursEnd: '10:00',
        createdById: superAdmin.id,
      },
      {
        id: 'plan_weekly_cab_blr',
        name: 'Bangalore Weekly Cab',
        description: 'Weekly subscription for cab drivers in Bangalore',
        city: 'Bangalore',
        vehicleType: VehicleType.CAB,
        billingCycle: BillingCycle.WEEKLY,
        basePrice: 299,
        peakHoursDiscount: 0.10,
        offPeakDiscount: 0.20,
        peakHoursStart: '06:00',
        peakHoursEnd: '10:00',
        createdById: superAdmin.id,
      },
      {
        id: 'plan_monthly_cab_blr',
        name: 'Bangalore Monthly Cab',
        description: 'Monthly subscription for cab drivers in Bangalore',
        city: 'Bangalore',
        vehicleType: VehicleType.CAB,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 999,
        peakHoursDiscount: 0.10,
        offPeakDiscount: 0.25,
        peakHoursStart: '06:00',
        peakHoursEnd: '10:00',
        createdById: superAdmin.id,
      },
    ],
  });

  console.log('Seed complete. Admin credentials:');
  console.log('  Super Admin: admin@transitco.in / Admin@123!');
  console.log('  City Admin:  bangalore@transitco.in / Blr@123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
