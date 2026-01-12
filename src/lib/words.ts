export const wordCategories: Record<string, { words: string[]; hints: string[] }> = {
  Movies: {
    words: [
      'Titanic', 'Inception', 'Avatar', 'Frozen', 'Jaws',
      'Gladiator', 'Matrix', 'Shrek', 'Godfather', 'Jurassic Park',
      'Star Wars', 'Avengers', 'Joker', 'Batman', 'Spider-Man',
      'Forrest Gump', 'Pulp Fiction', 'Fight Club', 'Interstellar', 'Gravity'
    ],
    hints: ['Entertainment', 'Cinema', 'Film', 'Hollywood', 'Blockbuster']
  },
  Places: {
    words: [
      'Paris', 'Tokyo', 'New York', 'London', 'Sydney',
      'Rome', 'Dubai', 'Singapore', 'Barcelona', 'Amsterdam',
      'Las Vegas', 'Hawaii', 'Maldives', 'Venice', 'Cairo',
      'Moscow', 'Rio', 'Miami', 'Berlin', 'Toronto'
    ],
    hints: ['Location', 'Geography', 'Destination', 'Travel', 'City']
  },
  Objects: {
    words: [
      'Umbrella', 'Telescope', 'Scissors', 'Candle', 'Mirror',
      'Clock', 'Lamp', 'Piano', 'Guitar', 'Camera',
      'Bicycle', 'Skateboard', 'Surfboard', 'Microphone', 'Headphones',
      'Sunglasses', 'Wallet', 'Backpack', 'Laptop', 'Phone'
    ],
    hints: ['Thing', 'Item', 'Tool', 'Gadget', 'Equipment']
  },
  Food: {
    words: [
      'Pizza', 'Sushi', 'Burger', 'Taco', 'Pasta',
      'Croissant', 'Ramen', 'Steak', 'Salad', 'Pancakes',
      'Ice Cream', 'Chocolate', 'Popcorn', 'Donut', 'Waffles',
      'Curry', 'Burrito', 'Dim Sum', 'Fondue', 'Paella'
    ],
    hints: ['Cuisine', 'Meal', 'Dish', 'Snack', 'Delicacy']
  },
  Games: {
    words: [
      'Chess', 'Monopoly', 'Poker', 'Tetris', 'Mario',
      'Minecraft', 'Fortnite', 'Soccer', 'Basketball', 'Tennis',
      'Golf', 'Bowling', 'Darts', 'Pool', 'Jenga',
      'Scrabble', 'Uno', 'Twister', 'Charades', 'Pictionary'
    ],
    hints: ['Recreation', 'Sport', 'Activity', 'Competition', 'Entertainment']
  },
  Animals: {
    words: [
      'Elephant', 'Penguin', 'Dolphin', 'Tiger', 'Giraffe',
      'Kangaroo', 'Octopus', 'Flamingo', 'Peacock', 'Panda',
      'Koala', 'Gorilla', 'Cheetah', 'Owl', 'Eagle',
      'Shark', 'Whale', 'Jellyfish', 'Butterfly', 'Chameleon'
    ],
    hints: ['Creature', 'Wildlife', 'Nature', 'Living thing', 'Species']
  },
  Professions: {
    words: [
      'Doctor', 'Astronaut', 'Chef', 'Pilot', 'Detective',
      'Firefighter', 'Teacher', 'Scientist', 'Artist', 'Musician',
      'Actor', 'Photographer', 'Architect', 'Engineer', 'Lawyer',
      'Nurse', 'Veterinarian', 'Journalist', 'Athlete', 'Dancer'
    ],
    hints: ['Career', 'Occupation', 'Job', 'Work', 'Profession']
  },
  Technology: {
    words: [
      'Robot', 'Drone', 'Satellite', 'Laser', 'Hologram',
      'Virtual Reality', 'Cryptocurrency', 'Algorithm', 'Firewall', 'Cloud',
      'Bluetooth', 'WiFi', 'GPS', 'Touchscreen', '3D Printer',
      'Electric Car', 'Solar Panel', 'Smart Watch', 'Alexa', 'Tesla'
    ],
    hints: ['Innovation', 'Digital', 'Future', 'Science', 'Invention']
  }
};

export function getRandomWord(categories: string[]): { word: string; hint: string; category: string } {
  const validCategories = categories.filter(cat => wordCategories[cat]);
  if (validCategories.length === 0) {
    validCategories.push('Objects'); // fallback
  }
  
  const randomCategory = validCategories[Math.floor(Math.random() * validCategories.length)];
  const categoryData = wordCategories[randomCategory];
  const randomWord = categoryData.words[Math.floor(Math.random() * categoryData.words.length)];
  const randomHint = categoryData.hints[Math.floor(Math.random() * categoryData.hints.length)];
  
  return { word: randomWord, hint: randomHint, category: randomCategory };
}

export function getAllCategories(): string[] {
  return Object.keys(wordCategories);
}
