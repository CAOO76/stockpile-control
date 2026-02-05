/**
 * StockpileAsset Type
 * Objeto compatible con extensions.stockpile-control para trazabilidad y georeferencia.
 */

export interface StockpileAsset {
    // Identificación
    id: string;
    name: string;
    asset_type: 'mineral' | 'coal' | 'other';

    // Volumetría
    volume_m3: number;
    estimated_tons: number;
    density_factor: number; // kg/m³

    // Confiabilidad
    confidence_level: number; // 0-100
    calculation_method: 'convex-hull' | 'delaunay' | 'voxel';

    // Georeferencia (región southamerica-west1)
    geo_point: {
        latitude: number;
        longitude: number;
        altitude: number | null;
        accuracy: number; // metros
    };
    region: 'southamerica-west1';

    // Trazabilidad
    operator_notes: string;
    operator_name: string;
    captured_at: number; // timestamp
    processed_at: number; // timestamp

    // Recursos (URLs de Cloud Storage)
    proxy_image_url: string; // WebP gnerado (< 200kb)
    mesh_3d_url: string; // .glb comprimido

    // Metadata técnica
    metadata: {
        image_count: number;
        processing_time_ms: number;
        sensor_data_quality: number; // 0-100
        point_cloud_density: number; // número de puntos
    };
}
