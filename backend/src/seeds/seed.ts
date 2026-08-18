import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../shared/config/db.js';
import { hashPassword } from '../modules/auth/auth.service.js';
import { UserModel } from '../modules/auth/auth.model.js';
import { ServiceModel } from '../modules/services/service.model.js';
import { ServiceTypeModel } from '../modules/services/service-type.model.js';
import { BookingModel } from '../modules/bookings/booking.model.js';
import { calculateTotalPrice } from '../shared/utils/priceCalculator.js';

const run = async (): Promise<void> => {
  await connectDatabase();
  await Promise.all([
    BookingModel.deleteMany({}),
    ServiceModel.deleteMany({}),
    ServiceTypeModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);
  await ServiceTypeModel.create([
    {
      slug: 'venue',
      label: 'Venues',
      normalizedName: 'venues',
      singular: 'venue',
      description: 'Banquet halls, lawns and destination properties',
      capacityLabel: 'Guest capacity',
      dateLabel: 'Event dates',
    },
    {
      slug: 'hotel',
      label: 'Stays & villas',
      normalizedName: 'stays & villas',
      singular: 'stay',
      description: 'Hotels, resorts, villas and guest accommodation',
      capacityLabel: 'Guest capacity',
      dateLabel: 'Stay dates',
    },
    {
      slug: 'caterer',
      label: 'Catering',
      normalizedName: 'catering',
      singular: 'caterer',
      description: 'Menus and service teams for every celebration',
      capacityLabel: 'Serving capacity',
      dateLabel: 'Event dates',
    },
    {
      slug: 'cameraman',
      label: 'Photography',
      normalizedName: 'photography',
      singular: 'photographer',
      description: 'Photography and cinematic film teams',
      dateLabel: 'Shoot dates',
    },
    {
      slug: 'dj',
      label: 'DJs & sound',
      normalizedName: 'djs & sound',
      singular: 'music service',
      description: 'DJs, live sound, lighting and production',
      capacityLabel: 'Audience capacity',
      dateLabel: 'Event dates',
    },
  ]);
  const password = await hashPassword('Programme123');
  const [admin, user] = await UserModel.create([
    { name: 'Maya Kapoor', email: 'admin@programme.test', password, role: 'admin' },
    { name: 'Arjun Mehta', email: 'guest@programme.test', password, role: 'user' },
  ]);
  if (!admin || !user) throw new Error('Seed users could not be created');
  const services = await ServiceModel.create([
    {
      title: 'The Marigold Courtyard Haveli',
      category: 'venue',
      description:
        'A restored heritage haveli courtyard for grand wedding ceremonies and royal receptions, with warm stone arcades, fountain gardens, and rain-ready covered pavilion.',
      pricePerDay: 185000,
      capacity: 450,
      rating: 4.9,
      location: { city: 'Jaipur', state: 'Rajasthan', address: '22 Amer Road, Jaipur' },
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43210', email: 'courtyard@programme.test' },
      adminContactPhone: '+91 90000 41001',
      provider: admin._id,
      isActive: true,
    },
    {
      title: 'Villa Whispering Pines & Lawns',
      category: 'hotel',
      description:
        'Luxury 6-bedroom heritage villa with private swimming pool, sprawling manicured lawns, and panoramic valley views. Perfect for private family stays & sangeet nights.',
      pricePerDay: 125000,
      capacity: 25,
      rating: 4.8,
      location: { city: 'Udaipur', state: 'Rajasthan', address: '45 Lake Palace Road, Udaipur' },
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43214', email: 'villa@programme.test' },
      adminContactPhone: '+91 90000 41002',
      provider: admin._id,
      isActive: true,
    },
    {
      title: 'Saffron Table Banquet & Catering',
      category: 'caterer',
      description:
        'Season-led celebratory banquet menus served family-style, from live welcome chaats to authentic regional thalis, artisanal mocktails, and midnight dessert counters.',
      pricePerDay: 78000,
      capacity: 300,
      rating: 4.7,
      location: { city: 'Mumbai', state: 'Maharashtra', address: '14 Chapel Lane, Bandra West' },
      images: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43211', email: 'table@programme.test' },
      adminContactPhone: '+91 90000 41003',
      provider: admin._id,
      isActive: true,
    },
    {
      title: 'Frame by Frame Wedding Stories',
      category: 'cameraman',
      description:
        'Documentary wedding photography & cinematic drone film team with honest colour palettes, medium-format portraits, quiet direction, and complete high-res story delivery.',
      pricePerDay: 95000,
      capacity: 200,
      rating: 4.9,
      location: { city: 'Bengaluru', state: 'Karnataka', address: '18 Richmond Road' },
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43213', email: 'frames@programme.test' },
      adminContactPhone: '+91 90000 41004',
      provider: admin._id,
      isActive: true,
    },
    {
      title: 'Afterglow Concert Sound & DJ',
      category: 'dj',
      description:
        'A dance-floor-first music production team with custom playlist curation, wireless concert audio, intelligent moving head lighting, and an energetic, unhurried last set.',
      pricePerDay: 52000,
      capacity: 500,
      rating: 4.6,
      location: { city: 'Delhi', state: 'Delhi', address: '7 Hauz Khas Village' },
      images: [
        'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43212', email: 'sound@programme.test' },
      adminContactPhone: '+91 90000 41005',
      provider: admin._id,
      isActive: true,
    },
    {
      title: 'The Grand Royal Orchid Resort & Stay',
      category: 'hotel',
      description:
        'A 5-star luxury stay resort with 40 guest suites, heated infinity pool, spa, and private garden pavilions for destination wedding guests.',
      pricePerDay: 240000,
      capacity: 120,
      rating: 4.9,
      location: { city: 'Goa', state: 'Goa', address: '12 Calangute Beach Road, North Goa' },
      images: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43215', email: 'orchid@programme.test' },
      adminContactPhone: '+91 90000 41006',
      provider: admin._id,
      isActive: true,
    },
    {
      title: 'The Lotus Glasshouse Hall',
      category: 'venue',
      description:
        'Modern glasshouse venue surrounded by botanical gardens and ambient fairy lights. Fully air-conditioned banquet indoor space with outdoor lawn extension.',
      pricePerDay: 160000,
      capacity: 350,
      rating: 4.8,
      location: { city: 'Delhi', state: 'Delhi', address: '10 Mehrauli-Gurgaon Road' },
      images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43216', email: 'lotus@programme.test' },
      adminContactPhone: '+91 90000 41007',
      provider: admin._id,
      isActive: true,
    },
    {
      title: 'Flavours of Malabar Feast Tables',
      category: 'caterer',
      description:
        'Authentic coastal Indian, Mediterranean, and Pan-Asian buffet spread crafted by master chefs for grand celebrations and corporate galas.',
      pricePerDay: 85000,
      capacity: 400,
      rating: 4.7,
      location: { city: 'Bengaluru', state: 'Karnataka', address: '55 Indiranagar 100ft Road' },
      images: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=80',
      ],
      contactDetails: { phone: '+91 98765 43217', email: 'malabar@programme.test' },
      adminContactPhone: '+91 90000 41008',
      provider: admin._id,
      isActive: true,
    },
  ]);
  const firstService = services[0];
  if (firstService) {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() + 14);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    endDate.setUTCHours(23, 59, 59, 999);
    await BookingModel.create({
      user: user._id,
      service: firstService._id,
      startDate,
      endDate,
      ...calculateTotalPrice(startDate, endDate, firstService.pricePerDay),
      contactDetails: {
        name: user.name,
        phone: '+91 98765 40000',
        email: user.email,
        note: 'Please call in the afternoon to confirm event arrangements.',
      },
      status: 'confirmed',
    });
  }
  console.info(
    'Seed complete. Admin: admin@programme.test / Programme123 · User: guest@programme.test / Programme123',
  );
};
void run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await disconnectDatabase();
  });
