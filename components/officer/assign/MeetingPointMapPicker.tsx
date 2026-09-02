'use client';

import { useCallback, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, {
  Marker,
  NavigationControl,
  type MapLayerMouseEvent,
  type MapRef,
  type MarkerDragEvent,
} from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getMapStyle } from '@/lib/map/mapStyle';
import { isAbortError } from '@/lib/utils/abortError';
import { cn } from '@/lib/utils';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

async function searchAddress(query: string, signal: AbortSignal): Promise<NominatimResult[]> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'vn');
    const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('SEARCH_FAILED');
    return (await res.json()) as NominatimResult[];
  } catch (error) {
    if (isAbortError(error)) return [];
    throw error;
  }
}

export interface MeetingPointMapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
  className?: string;
}

/**
 * Chọn điểm tập trung bằng bản đồ: tìm địa chỉ (Nominatim/OSM, miễn phí — không cần API key)
 * rồi kéo marker để tinh chỉnh. Không cho nhập tay lat/lng.
 */
export function MeetingPointMapPicker({
  latitude,
  longitude,
  onChange,
  className,
}: MeetingPointMapPickerProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [search, setSearch] = useState('');
  const [resultsOpen, setResultsOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const {
    data: results = [],
    isFetching: searching,
    isError: hasSearchError,
  } = useQuery({
    queryKey: ['meeting-point-search', debouncedSearch],
    queryFn: ({ signal }) => searchAddress(debouncedSearch, signal),
    enabled: debouncedSearch.length > 0,
    staleTime: 60_000,
  });
  const searchError = hasSearchError ? 'Không tìm được địa điểm. Thử từ khoá khác.' : null;

  const flyTo = useCallback((lat: number, lng: number, zoom?: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom: zoom ?? map.getZoom(), duration: 600 });
  }, []);

  const handleSelectResult = (result: NominatimResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    onChange(lat, lng);
    flyTo(lat, lng, 16);
    setResultsOpen(false);
    setSearch(result.display_name);
  };

  const handleMarkerDragEnd = useCallback(
    (event: MarkerDragEvent) => {
      onChange(event.lngLat.lat, event.lngLat.lng);
    },
    [onChange]
  );

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      onChange(event.lngLat.lat, event.lngLat.lng);
      flyTo(event.lngLat.lat, event.lngLat.lng);
    },
    [onChange, flyTo]
  );

  return (
    <div className={cn('overflow-hidden rounded-lg border border-input', className)}>
      <div className="relative border-b border-border bg-background p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setResultsOpen(true);
            }}
            onFocus={() => results.length > 0 && setResultsOpen(true)}
            placeholder="Tìm địa điểm tập trung..."
            className="h-9 pl-9 pr-8 text-sm"
          />
          {searching ? (
            <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setResultsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {resultsOpen && debouncedSearch && (results.length > 0 || searchError) ? (
          <div className="absolute inset-x-2 top-[3.1rem] z-20 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
            {searchError ? (
              <p className="px-3 py-2.5 text-xs text-muted-foreground">{searchError}</p>
            ) : (
              <ul className="divide-y divide-border">
                {results.map(result => (
                  <li key={result.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/60"
                    >
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{result.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="relative h-56 w-full">
        <Map
          ref={mapRef}
          initialViewState={{ longitude, latitude, zoom: 15 }}
          mapStyle={getMapStyle()}
          projection={{ type: 'globe' }}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
          onClick={handleMapClick}
          onError={event => {
            const err = event.error;
            if (isAbortError(err) || isAbortError(String(err))) return;
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Marker
            longitude={longitude}
            latitude={latitude}
            draggable
            onDragEnd={handleMarkerDragEnd}
            anchor="bottom"
          >
            <MapPin className="size-8 -translate-y-1 fill-emerald-500 text-emerald-700 drop-shadow" />
          </Marker>
        </Map>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
        <MapPin className="size-3" />
        Kéo marker hoặc bấm vào bản đồ để chọn chính xác điểm tập trung.
      </div>
    </div>
  );
}
