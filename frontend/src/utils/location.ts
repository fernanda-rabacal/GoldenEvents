// "Parque da Cidade, Salvador - BA" -> { place: 'Parque da Cidade', region: 'Salvador - BA' }
export function splitLocation(location: string) {
  const [place, ...region] = location.split(',');

  return { place: place.trim(), region: region.join(',').trim() };
}

export function getMapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
