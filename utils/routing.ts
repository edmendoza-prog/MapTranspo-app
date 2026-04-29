// Utility functions for road routing using OSRM API

export type RouteCoordinate = [number, number]; // [lat, lng]

/**
 * Fetch actual road path between multiple waypoints using OSRM API
 * @param waypoints Array of [lat, lng] coordinates
 * @returns Array of coordinates following actual roads
 */
export async function fetchRoadPath(
  waypoints: RouteCoordinate[]
): Promise<RouteCoordinate[] | null> {
  if (waypoints.length < 2) {
    return waypoints;
  }

  try {
    // OSRM expects coordinates in [lng, lat] format
    const coordinates = waypoints
      .map(([lat, lng]) => `${lng},${lat}`)
      .join(';');

    // Use public OSRM demo server (for production, consider self-hosting)
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('OSRM API error:', response.statusText);
      return waypoints; // Fallback to straight lines
    }

    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const geometry = data.routes[0].geometry;
      
      // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
      const roadPath: RouteCoordinate[] = geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      return roadPath;
    }

    return waypoints; // Fallback to straight lines
  } catch (error) {
    console.error('Error fetching road path:', error);
    return waypoints; // Fallback to straight lines
  }
}

/**
 * Fetch road paths for multiple routes in parallel
 * @param routes Array of route waypoints
 * @returns Array of road paths
 */
export async function fetchMultipleRoadPaths(
  routes: RouteCoordinate[][]
): Promise<(RouteCoordinate[] | null)[]> {
  return Promise.all(routes.map(waypoints => fetchRoadPath(waypoints)));
}

/**
 * Batch fetch with rate limiting to avoid overwhelming the API
 * @param routes Array of route waypoints
 * @param delayMs Delay between requests in milliseconds
 * @returns Array of road paths
 */
export async function fetchRoadPathsWithDelay(
  routes: RouteCoordinate[][],
  delayMs: number = 200
): Promise<(RouteCoordinate[] | null)[]> {
  const results: (RouteCoordinate[] | null)[] = [];
  
  for (const route of routes) {
    const path = await fetchRoadPath(route);
    results.push(path);
    
    // Add delay between requests
    if (routes.indexOf(route) < routes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
