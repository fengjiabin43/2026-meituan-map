import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { CATEGORIES } from './constants';

const universities = [
  { name: '北京大学', lat: 39.99, lng: 116.31 },
  { name: '清华大学', lat: 40.00, lng: 116.33 },
  { name: '中国人民大学', lat: 39.97, lng: 116.32 },
  { name: '北京交通大学', lat: 39.95, lng: 116.33 },
  { name: '北京师范大学', lat: 39.96, lng: 116.36 },
];

const priceRanges = ['¥', '¥¥', '¥¥¥'];

export async function seedData() {
  const restaurantsCollection = collection(db, 'restaurants');
  const categoriesList = Object.keys(CATEGORIES);
  
  for (const uni of universities) {
    for (let i = 0; i < 5; i++) {
      const lat = uni.lat + (Math.random() - 0.5) * 0.02;
      const lng = uni.lng + (Math.random() - 0.5) * 0.02;
      const category = categoriesList[Math.floor(Math.random() * categoriesList.length)];
      const subCategories = CATEGORIES[category as keyof typeof CATEGORIES];
      const subCategory = subCategories[Math.floor(Math.random() * subCategories.length)];
      
      await addDoc(restaurantsCollection, {
        name: `${uni.name}周边餐厅 ${i + 1}`,
        category,
        subCategory,
        priceRange: priceRanges[Math.floor(Math.random() * priceRanges.length)],
        location: { lat, lng },
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
      });
    }
  }
  console.log('Data seeded successfully!');
}

export async function seedMoreData(count: number) {
  const restaurantsCollection = collection(db, 'restaurants');
  const categoriesList = Object.keys(CATEGORIES);
  
  for (let i = 0; i < count; i++) {
    const uni = universities[Math.floor(Math.random() * universities.length)];
    const lat = uni.lat + (Math.random() - 0.5) * 0.05;
    const lng = uni.lng + (Math.random() - 0.5) * 0.05;
    const category = categoriesList[Math.floor(Math.random() * categoriesList.length)];
    const subCategories = CATEGORIES[category as keyof typeof CATEGORIES];
    const subCategory = subCategories[Math.floor(Math.random() * subCategories.length)];
    
    await addDoc(restaurantsCollection, {
      name: `${uni.name}周边餐厅 ${Math.floor(Math.random() * 1000)}`,
      category,
      subCategory,
      priceRange: priceRanges[Math.floor(Math.random() * priceRanges.length)],
      location: { lat, lng },
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
    });
  }
  console.log(`${count} restaurants added successfully!`);
}
