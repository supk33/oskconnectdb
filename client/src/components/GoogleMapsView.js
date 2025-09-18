import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBedsJuM7yDPHk1zXiu8yrcA2VRIM8Z_48';

// Test API key validity
const testGoogleMapsAPI = () => {
  const testUrl = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
  console.log('Testing Google Maps API key:', testUrl);
  
  fetch(testUrl)
    .then(response => {
      console.log('Google Maps API response status:', response.status);
      if (response.status === 200) {
        console.log('Google Maps API key is valid');
      } else {
        console.error('Google Maps API key validation failed:', response.status);
      }
      return response.text();
    })
    .then(data => {
      console.log('Google Maps API response preview:', data.substring(0, 200));
      if (data.includes('error')) {
        console.error('Google Maps API returned error:', data);
      }
    })
    .catch(error => {
      console.error('Google Maps API test failed:', error);
    });
};

// Global callback function for Google Maps API
window.initGoogleMaps = () => {
  console.log('Google Maps API callback executed');
  // This will be called when Google Maps API is loaded
};

const GoogleMapsView = ({ shops = [], center, zoom, onShopClick, className = "h-96" }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  console.log('GoogleMapsView - Component render:', {
    shopsCount: shops?.length,
    center,
    zoom,
    className,
    isLoaded,
    loadError
  });

  // Load Google Maps API
  useEffect(() => {
    // Test API key on first load
    testGoogleMapsAPI();
    
    let timeoutId;
    
    const loadGoogleMaps = () => {
      console.log('GoogleMapsView - Starting to load Google Maps API');
      
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('GoogleMapsView - Google Maps already loaded');
        setIsLoaded(true);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('GoogleMapsView - Script already exists, waiting for load...');
        existingScript.onload = () => {
          console.log('GoogleMapsView - Existing script loaded');
          if (window.google && window.google.maps) {
            console.log('GoogleMapsView - Google Maps API loaded from existing script');
            setIsLoaded(true);
            setLoadError(null);
          }
        };
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('GoogleMapsView - Google Maps API script loaded');
        // Wait a bit for Google Maps to initialize
        setTimeout(() => {
          if (window.google && window.google.maps) {
            console.log('GoogleMapsView - Google Maps API loaded successfully');
            setIsLoaded(true);
            setLoadError(null);
            clearTimeout(timeoutId);
          } else {
            console.log('GoogleMapsView - Google Maps API not ready, retrying...');
            setTimeout(() => {
              if (window.google && window.google.maps) {
                console.log('GoogleMapsView - Google Maps API loaded on retry');
                setIsLoaded(true);
                setLoadError(null);
                clearTimeout(timeoutId);
              } else {
                console.error('GoogleMapsView - Google Maps API failed to load');
                setLoadError('Google Maps API failed to initialize');
              }
            }, 1000);
          }
        }, 500);
      };
      
      script.onerror = (error) => {
        console.error('GoogleMapsView - Failed to load Google Maps API:', error);
        console.error('GoogleMapsView - Script src:', script.src);
        setLoadError('Failed to load Google Maps');
        setIsLoaded(false);
        clearTimeout(timeoutId);
      };
      
      document.head.appendChild(script);
      
      // Set a timeout to handle cases where the API takes too long to load
      timeoutId = setTimeout(() => {
        if (!isLoaded) {
          console.error('GoogleMapsView - Google Maps API loading timeout');
          setLoadError('Google Maps API loading timeout');
        }
      }, 10000); // 10 second timeout
    };

    loadGoogleMaps();

    return () => {
      // Don't cleanup script on unmount to avoid reloading
      console.log('GoogleMapsView - Component unmounting, keeping script');
      clearTimeout(timeoutId);
    };
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    console.log('GoogleMapsView - Map initialization check:', {
      isLoaded,
      hasMapRef: !!mapRef.current,
      hasMap: !!map,
      hasGoogle: !!window.google
    });
    
    if (isLoaded && mapRef.current && !map && window.google) {
      const mapCenter = center || { lat: 13.7563, lng: 100.5018 }; // Bangkok default
      console.log('GoogleMapsView - Creating map with center:', mapCenter);
      
      try {
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: zoom || 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });
        
        console.log('GoogleMapsView - Map created successfully:', newMap);
        setMap(newMap);
      } catch (error) {
        console.error('GoogleMapsView - Error creating map:', error);
        setLoadError('Failed to create map');
      }
    }
  }, [isLoaded, mapRef, map, center, zoom]);

  // Fallback: Try to initialize map even if isLoaded is false but Google Maps is available
  useEffect(() => {
    if (!isLoaded && !map && mapRef.current && window.google && window.google.maps) {
      console.log('GoogleMapsView - Fallback: Google Maps available, initializing map');
      setIsLoaded(true);
    }
  }, [isLoaded, map]);

  // Update markers when shops change
  useEffect(() => {
    console.log('GoogleMapsView - Markers update check:', {
      hasMap: !!map,
      shopsCount: shops?.length,
      hasGoogle: !!window.google,
      shops: shops?.map(s => ({ 
        id: s.id, 
        name: s.shopName, 
        lat: s.latitude, 
        lng: s.longitude,
        status: s.status
      }))
    });
    
    if (map && shops && window.google) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = shops.map(shop => {
        if (!shop.latitude || !shop.longitude) {
          console.log('GoogleMapsView - Shop missing coordinates:', shop.shopName);
          return null;
        }
        
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(shop.latitude), lng: parseFloat(shop.longitude) },
          map: map,
          title: shop.shopName,
          icon: {
            url: getMarkerIcon(shop.status),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: createInfoWindowContent(shop)
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          if (onShopClick) {
            onShopClick(shop);
          }
        });

        console.log('GoogleMapsView - Created marker for shop:', shop.shopName);
        return marker;
      }).filter(Boolean);

      console.log('GoogleMapsView - Total markers created:', newMarkers.length);
      setMarkers(newMarkers);
    }
  }, [map, shops, onShopClick]);

  const getMarkerIcon = (status) => {
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
    switch (status) {
      case 'approved':
        return baseUrl + 'green-dot.png';
      case 'pending':
        return baseUrl + 'yellow-dot.png';
      case 'rejected':
        return baseUrl + 'red-dot.png';
      default:
        return baseUrl + 'blue-dot.png';
    }
  };

  const createInfoWindowContent = (shop) => {
    return `
      <div class="p-2 max-w-xs">
        <h3 class="font-semibold text-gray-900 mb-2">${shop.shopName}</h3>
        <p class="text-sm text-gray-600 mb-2">${shop.description || 'ไม่มีรายละเอียด'}</p>
        <p class="text-xs text-gray-500 mb-2">${shop.address || 'ไม่มีที่อยู่'}</p>
        <p class="text-xs text-gray-500 mb-2">${shop.phone || 'ไม่มีเบอร์โทร'}</p>
        <div class="flex items-center justify-between">
          <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            shop.status === 'approved' 
              ? 'bg-green-100 text-green-800'
              : shop.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }">
            ${shop.status === 'approved' ? 'อนุมัติแล้ว' : 
              shop.status === 'pending' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}
          </span>
          <span class="text-xs text-gray-500">
            ${formatDate(shop.createdAt)}
          </span>
        </div>
      </div>
    `;
  };

  const formatDate = (date) => {
    if (!date) return 'ไม่ระบุ';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH');
  };


  const validShops = shops.filter(shop => shop.latitude && shop.longitude);
  
  console.log('GoogleMapsView - Rendering main map:', {
    validShopsCount: validShops.length,
    totalShopsCount: shops.length,
    isLoaded,
    loadError,
    hasMap: !!map
  });

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          แผนที่ร้านค้า ({validShops.length} ร้าน)
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>อนุมัติแล้ว</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>รออนุมัติ</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>ไม่อนุมัติ</span>
          </div>
        </div>
      </div>
      
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {!isLoaded && !loadError ? (
          <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ minHeight: '300px', backgroundColor: '#f0f0f0' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <span className="text-gray-600">กำลังโหลดแผนที่...</span>
            </div>
          </div>
        ) : loadError ? (
          <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ minHeight: '300px', backgroundColor: '#f0f0f0' }}>
            <div className="text-center text-red-600">
              <div className="text-xl mb-2">⚠️</div>
              <div>ไม่สามารถโหลดแผนที่ได้</div>
              <div className="text-sm text-gray-500 mt-1">กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</div>
            </div>
          </div>
        ) : (
          <div 
            ref={mapRef} 
            className="w-full h-full rounded-lg"
            style={{ minHeight: '300px', backgroundColor: '#f0f0f0' }}
          />
        )}
      </div>
      
      {validShops.length === 0 && shops.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <div>ไม่มีร้านค้าที่มีข้อมูลพิกัด</div>
          <div className="text-sm mt-1">กรุณาเพิ่มข้อมูลพิกัด (ละติจูด/ลองจิจูด) ในร้านค้า</div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 font-medium mb-2">ข้อมูล Debug:</div>
            <div className="text-sm text-yellow-700">
              <div>จำนวนร้านค้าทั้งหมด: {shops.length}</div>
              <div>จำนวนร้านค้าที่มีพิกัด: {validShops.length}</div>
              <div className="mt-2">
                ร้านค้าที่ไม่มีพิกัด:
                <ul className="list-disc list-inside mt-1">
                  {shops.filter(shop => !shop.latitude || !shop.longitude).map(shop => (
                    <li key={shop.id} className="text-xs">{shop.shopName}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsView;