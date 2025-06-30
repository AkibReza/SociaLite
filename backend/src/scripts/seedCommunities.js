const mongoose = require("mongoose");
const Community = require("../models/Community");
require("dotenv").config();

const communities = [
  {
    name: "Gaming",
    description:
      "Connect with fellow gamers and discuss your favorite games, strategies, and gaming experiences.",
    icon: "🎮",
  },
  {
    name: "Movies & TV",
    description:
      "Share your love for cinema and television. Discuss latest releases, classics, and hidden gems.",
    icon: "🎬",
  },
  {
    name: "Books & Reading",
    description:
      "Book lovers unite! Share recommendations, discuss your current reads, and join book clubs.",
    icon: "📚",
  },
  {
    name: "Travel",
    description:
      "Explore the world together. Share travel stories, tips, and plan future adventures.",
    icon: "✈️",
  },
  {
    name: "Fitness & Health",
    description:
      "Motivate each other on fitness journeys. Share workout tips, healthy recipes, and wellness advice.",
    icon: "💪",
  },
  {
    name: "Food & Cooking",
    description:
      "Foodies welcome! Share recipes, cooking tips, restaurant recommendations, and culinary adventures.",
    icon: "🍳",
  },
  {
    name: "Music",
    description:
      "Unite through the power of music. Discover new artists, share playlists, and discuss all genres.",
    icon: "🎵",
  },
  {
    name: "Technology",
    description:
      "Stay updated with the latest in tech. Discuss gadgets, programming, and digital innovations.",
    icon: "💻",
  },
  {
    name: "Art & Creativity",
    description:
      "Express your creative side. Share artwork, creative projects, and inspire each other.",
    icon: "🎨",
  },
  {
    name: "Sports",
    description:
      "Sports enthusiasts gather here! Discuss games, teams, and share your passion for sports.",
    icon: "⚽",
  },
  {
    name: "Photography",
    description:
      "Capture and share beautiful moments. Get feedback on your photos and learn new techniques.",
    icon: "📸",
  },
  {
    name: "Pets & Animals",
    description:
      "Animal lovers unite! Share photos of your pets, discuss pet care, and celebrate our furry friends.",
    icon: "🐕",
  },
];

async function seedCommunities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Clear existing communities
    await Community.deleteMany({});
    console.log("Cleared existing communities");

    // Insert new communities
    await Community.insertMany(communities);
    console.log("Communities seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding communities:", error);
    process.exit(1);
  }
}

seedCommunities();
