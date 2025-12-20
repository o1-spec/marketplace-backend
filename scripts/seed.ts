import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';

dotenv.config({ path: '../.env' });
console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Temporarily hardcode the URI for testing
const MONGODB_URI = 'mongodb+srv://oluwafemionadokun:CMBxbucHwAfkYZAG@cluster0.xpileiu.mongodb.net/marketplace';

const sampleListings = [
  // Electronics (4 products)
  {
    title: "MacBook Pro M3 14-inch",
    description: "Powerful MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Perfect for creative professionals and developers.",
    price: 1999,
    category: "Electronics",
    subcategory: "Laptops",
    condition: "new",
    brand: "Apple",
    modelNumber: "MacBook Pro 14-inch",
    images: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500",
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500"
    ],
    location: {
      address: "",
      city: "Lagos",
      state: "Lagos",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 150,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["macbook", "apple", "laptop", "m3"],
    attributes: {
      processor: "M3",
      ram: "16GB",
      storage: "512GB SSD",
      display: "14.2-inch Liquid Retina XDR"
    }
  },
  {
    title: "iPhone 15 Pro Max 256GB",
    description: "Latest iPhone 15 Pro Max in Natural Titanium. Includes original box and accessories.",
    price: 1299,
    category: "Electronics",
    subcategory: "Phones",
    condition: "new",
    brand: "Apple",
    modelNumber: "iPhone 15 Pro Max",
    images: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500"
    ],
    location: {
      address: "",
      city: "Abuja",
      state: "FCT",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 50,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["iphone", "apple", "smartphone"],
    attributes: {
      storage: "256GB",
      color: "Natural Titanium",
      camera: "48MP Pro camera system"
    }
  },
  {
    title: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading noise canceling wireless headphones with 30-hour battery life.",
    price: 349,
    category: "Electronics",
    subcategory: "Audio",
    condition: "new",
    brand: "Sony",
    modelNumber: "WH-1000XM5",
    images: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500"
    ],
    location: {
      address: "",
      city: "Port Harcourt",
      state: "Rivers",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 30,
    pickupOnly: false,
    isNegotiable: true,
    tags: ["sony", "headphones", "wireless", "noise-canceling"],
    attributes: {
      batteryLife: "30 hours",
      connectivity: "Bluetooth 5.2",
      weight: "250g"
    }
  },
  {
    title: "Nintendo Switch OLED Model",
    description: "Nintendo Switch OLED model with enhanced screen and 64GB storage. Includes dock and joy-cons.",
    price: 349,
    category: "Electronics",
    subcategory: "Gaming",
    condition: "new",
    brand: "Nintendo",
    modelNumber: "Switch OLED",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500"
    ],
    location: {
      address: "",
      city: "Kano",
      state: "Kano",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 40,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["nintendo", "switch", "gaming", "console"],
    attributes: {
      storage: "64GB",
      display: "7-inch OLED screen",
      batteryLife: "9 hours"
    }
  },

  // Fashion (3 products)
  {
    title: "Nike Air Max 270 React",
    description: "Comfortable Nike Air Max 270 React sneakers, size 10. Great for running and casual wear.",
    price: 150,
    category: "Fashion",
    subcategory: "Shoes",
    condition: "like_new",
    brand: "Nike",
    modelNumber: "Air Max 270 React",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500"
    ],
    location: {
      address: "",
      city: "Ibadan",
      state: "Oyo",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 20,
    pickupOnly: false,
    isNegotiable: true,
    tags: ["nike", "sneakers", "shoes", "running"],
    attributes: {
      size: "10",
      color: "Black/White",
      material: "Mesh and synthetic"
    }
  },
  {
    title: "Levi's 501 Original Jeans",
    description: "Classic Levi's 501 original fit jeans, size 32x32. Vintage style, excellent condition.",
    price: 85,
    category: "Fashion",
    subcategory: "Clothing",
    condition: "good",
    brand: "Levi's",
    modelNumber: "501 Original",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
      "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=500"
    ],
    location: {
      address: "",
      city: "Enugu",
      state: "Enugu",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 15,
    pickupOnly: false,
    isNegotiable: true,
    tags: ["levis", "jeans", "clothing", "denim"],
    attributes: {
      size: "32x32",
      fit: "Original",
      material: "100% Cotton"
    }
  },
  {
    title: "Rolex Submariner Date",
    description: "Luxury Rolex Submariner Date watch with stainless steel case and ceramic bezel.",
    price: 8500,
    category: "Fashion",
    subcategory: "Accessories",
    condition: "good",
    brand: "Rolex",
    modelNumber: "Submariner Date",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500"
    ],
    location: {
      address: "",
      city: "Lagos",
      state: "Lagos",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: false,
    pickupOnly: true,
    isNegotiable: false,
    tags: ["rolex", "watch", "luxury", "accessories"],
    attributes: {
      caseMaterial: "Stainless Steel",
      dialColor: "Black",
      waterResistance: "300m"
    }
  },

  // Home (3 products)
  {
    title: "Dyson V15 Detect Vacuum",
    description: "Powerful cordless vacuum with laser dust detection and intelligent suction.",
    price: 699,
    category: "Home",
    subcategory: "Appliances",
    condition: "new",
    brand: "Dyson",
    modelNumber: "V15 Detect",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500"
    ],
    location: {
      address: "",
      city: "Abuja",
      state: "FCT",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 80,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["dyson", "vacuum", "cleaning", "appliances"],
    attributes: {
      batteryLife: "60 minutes",
      weight: "3.1kg",
      filtration: "HEPA"
    }
  },
  {
    title: "IKEA KIVIK Sofa",
    description: "Comfortable 3-seater sofa with removable covers. Perfect for modern living rooms.",
    price: 450,
    category: "Home",
    subcategory: "Furniture",
    condition: "good",
    brand: "IKEA",
    modelNumber: "KIVIK",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500"
    ],
    location: {
      address: "",
      city: "Port Harcourt",
      state: "Rivers",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: false,
    pickupOnly: true,
    isNegotiable: true,
    tags: ["ikea", "sofa", "furniture", "living room"],
    attributes: {
      seats: "3-seater",
      material: "Fabric",
      color: "Gray"
    }
  },
  {
    title: "KitchenAid Stand Mixer",
    description: "Professional 5-quart stand mixer with multiple attachments. Excellent for baking enthusiasts.",
    price: 379,
    category: "Home",
    subcategory: "Kitchen",
    condition: "new",
    brand: "KitchenAid",
    modelNumber: "5KSM125EER",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"
    ],
    location: {
      address: "",
      city: "Kano",
      state: "Kano",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 60,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["kitchenaid", "mixer", "kitchen", "baking"],
    attributes: {
      capacity: "5 quarts",
      power: "325 watts",
      attachments: "3 included"
    }
  },

  // Sports (2 products)
  {
    title: "Peloton Bike+",
    description: "Connected indoor cycling bike with HD touchscreen and live classes.",
    price: 2495,
    category: "Sports",
    subcategory: "Fitness Equipment",
    condition: "new",
    brand: "Peloton",
    modelNumber: "Bike+",
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"
    ],
    location: {
      address: "",
      city: "Ibadan",
      state: "Oyo",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: false,
    pickupOnly: true,
    isNegotiable: false,
    tags: ["peloton", "bike", "fitness", "cycling"],
    attributes: {
      screenSize: "23.8-inch HD touchscreen",
      resistance: "Magnetic",
      maxWeight: "300 lbs"
    }
  },
  {
    title: "Wilson Pro Staff Tennis Racket",
    description: "Professional tennis racket used by Roger Federer. Excellent condition with cover.",
    price: 199,
    category: "Sports",
    subcategory: "Tennis",
    condition: "good",
    brand: "Wilson",
    modelNumber: "Pro Staff",
    images: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"
    ],
    location: {
      address: "",
      city: "Enugu",
      state: "Enugu",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 25,
    pickupOnly: false,
    isNegotiable: true,
    tags: ["wilson", "tennis", "racket", "sports"],
    attributes: {
      weight: "340g",
      headSize: "97 sq in",
      balance: "Head light"
    }
  },

  // Books (2 products)
  {
    title: "The Complete Works of William Shakespeare",
    description: "Beautiful leather-bound collection of all Shakespeare's plays and sonnets.",
    price: 125,
    category: "Books",
    subcategory: "Literature",
    condition: "good",
    brand: "",
    modelNumber: "",
    images: [
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
    ],
    location: {
      address: "",
      city: "Lagos",
      state: "Lagos",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 15,
    pickupOnly: false,
    isNegotiable: true,
    tags: ["shakespeare", "literature", "books", "classics"],
    attributes: {
      pages: "1200+",
      binding: "Leather",
      language: "English"
    }
  },
  {
    title: "Steve Jobs Biography",
    description: "Authorized biography of Steve Jobs by Walter Isaacson. First edition hardcover.",
    price: 45,
    category: "Books",
    subcategory: "Biography",
    condition: "like_new",
    brand: "",
    modelNumber: "",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500"
    ],
    location: {
      address: "",
      city: "Abuja",
      state: "FCT",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 10,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["steve jobs", "biography", "apple", "books"],
    attributes: {
      author: "Walter Isaacson",
      pages: "656",
      edition: "First"
    }
  },

  // Toys (2 products)
  {
    title: "LEGO Creator 3-in-1 Deep Sea Creatures",
    description: "Buildable LEGO set featuring shark, octopus, and angler fish. Includes 580 pieces.",
    price: 89,
    category: "Toys",
    subcategory: "Building Sets",
    condition: "new",
    brand: "LEGO",
    modelNumber: "Creator 3-in-1",
    images: [
      "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500",
      "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500"
    ],
    location: {
      address: "",
      city: "Port Harcourt",
      state: "Rivers",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 20,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["lego", "building", "toys", "educational"],
    attributes: {
      pieces: "580",
      ageRange: "7-12 years",
      theme: "Deep Sea Creatures"
    }
  },
  {
    title: "Nintendo Switch Mario Kart 8 Deluxe",
    description: "Mario Kart 8 Deluxe game for Nintendo Switch. Includes 48 tracks and 42 characters.",
    price: 59,
    category: "Toys",
    subcategory: "Video Games",
    condition: "new",
    brand: "Nintendo",
    modelNumber: "Mario Kart 8 Deluxe",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500"
    ],
    location: {
      address: "",
      city: "Kano",
      state: "Kano",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 15,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["nintendo", "mario", "racing", "games"],
    attributes: {
      platform: "Nintendo Switch",
      players: "1-4",
      tracks: "48"
    }
  },

  // Vehicles (2 products)
  {
    title: "Honda CBR600RR Motorcycle",
    description: "2008 Honda CBR600RR sportbike with 599cc engine. Low mileage, well maintained.",
    price: 6500,
    category: "Vehicles",
    subcategory: "Motorcycles",
    condition: "good",
    brand: "Honda",
    modelNumber: "CBR600RR",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500"
    ],
    location: {
      address: "",
      city: "Ibadan",
      state: "Oyo",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: false,
    pickupOnly: true,
    isNegotiable: true,
    tags: ["honda", "motorcycle", "sportbike", "cbr"],
    attributes: {
      year: "2008",
      mileage: "15,000 km",
      engine: "599cc inline-4"
    }
  },
  {
    title: "Tesla Model 3 Long Range",
    description: "2022 Tesla Model 3 Long Range with autopilot. Excellent condition, all maintenance up to date.",
    price: 45000,
    category: "Vehicles",
    subcategory: "Electric Cars",
    condition: "like_new",
    brand: "Tesla",
    modelNumber: "Model 3 Long Range",
    images: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500",
      "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=500"
    ],
    location: {
      address: "",
      city: "Enugu",
      state: "Enugu",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: false,
    pickupOnly: true,
    isNegotiable: false,
    tags: ["tesla", "electric", "model 3", "autopilot"],
    attributes: {
      year: "2022",
      range: "405 miles",
      acceleration: "0-60 mph in 5.8s"
    }
  },

  // Other (2 products)
  {
    title: "Vintage Gibson Les Paul Guitar",
    description: "1965 Gibson Les Paul Standard with original case. Professionally maintained and restrung.",
    price: 12000,
    category: "Other",
    subcategory: "Musical Instruments",
    condition: "good",
    brand: "Gibson",
    modelNumber: "Les Paul Standard",
    images: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500"
    ],
    location: {
      address: "",
      city: "Lagos",
      state: "Lagos",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: false,
    pickupOnly: true,
    isNegotiable: true,
    tags: ["gibson", "guitar", "vintage", "musical"],
    attributes: {
      year: "1965",
      bodyMaterial: "Mahogany",
      finish: "Cherry Sunburst"
    }
  },
  {
    title: "Professional Drone with 4K Camera",
    description: "DJI Mavic Air 2 drone with 4K camera, 34-minute flight time, and intelligent flight modes.",
    price: 799,
    category: "Other",
    subcategory: "Electronics",
    condition: "new",
    brand: "DJI",
    modelNumber: "Mavic Air 2",
    images: [
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=500"
    ],
    location: {
      address: "",
      city: "Abuja",
      state: "FCT",
      zipCode: "",
      country: "NGA"
    },
    shippingAvailable: true,
    shippingCost: 50,
    pickupOnly: false,
    isNegotiable: false,
    tags: ["dji", "drone", "camera", "4k"],
    attributes: {
      camera: "48MP 4K",
      flightTime: "34 minutes",
      range: "10 km"
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);  // Use the hardcoded URI
    console.log('✅ Connected to MongoDB');

    let sampleUser = await User.findOne();
    if (!sampleUser) {
      console.log('📝 Creating sample user...');
      sampleUser = new User({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        location: "Lagos, Nigeria",
      });
      await sampleUser.save();
      console.log('✅ Sample user created');
    }

    console.log(`📝 Seeding ${sampleListings.length} listings for user: ${sampleUser.name}`);

    const listingsWithSeller = sampleListings.map(listing => ({
      ...listing,
      sellerId: sampleUser._id
    }));

    await Product.deleteMany({});
    console.log('🧹 Cleared existing listings');

    const insertedListings = await Product.insertMany(listingsWithSeller);
    console.log(`✅ Successfully seeded ${insertedListings.length} listings`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();