// Haversine formula to calculate distance between two lat/lng points in kilometers
const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180
  const R = 6371 // Earth's radius in kilometers

  const dLat = toRad(coords2[0] - coords1[0])
  const dLon = toRad(coords2[1] - coords1[1])
  const lat1 = toRad(coords1[0])
  const lat2 = toRad(coords2[0])

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} meters`
  }
  return `${distanceKm.toFixed(1)} km`
}

export const distanceCategories = [
  { label: 'All Distances', min: 0, max: Infinity },
  { label: 'Very Near (0-500m)', min: 0, max: 0.5 },
  { label: 'Near (500m-2km)', min: 0.5, max: 2 },
  { label: 'Medium Distance (2km-5km)', min: 2, max: 5 },
  { label: 'Far (5km-15km)', min: 5, max: 15 },
  { label: 'Very Far (15km-30km)', min: 15, max: 30 },
  { label: 'Long Distance (30km+)', min: 30, max: Infinity },
]

export const filterByDistance = (mechanics, userLocation, selectedCategoryLabel) => {
  if (!userLocation) return mechanics

  const category = distanceCategories.find(cat => cat.label === selectedCategoryLabel)
  if (!category) return mechanics // Should not happen if dropdown is populated correctly

  return mechanics.filter(mechanic => {
    if (!mechanic.location) return false // Mechanic must have a location

    const distance = haversineDistance(userLocation, [mechanic.location.lat, mechanic.location.lng])
    return distance >= category.min && distance < category.max
  })
}

export { haversineDistance }

