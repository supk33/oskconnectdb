import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBedsJuM7yDPHk1zXiu8yrcA2VRIM8Z_48';

const GoogleMapsView = ({ shops = [], center, zoom, onShopClick, className = "h-96" }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoaded(true);
        setLoadError(null);
      };
      
      script.onerror = () => {
        setLoadError('Failed to load Google Maps');
        setIsLoaded(false);
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      // Cleanup script if component unmounts
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !map && window.google) {
      const mapCenter = center || { lat: 13.7563, lng: 100.5018 }; // Bangkok default
      
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
      
      setMap(newMap);
    }
  }, [isLoaded, mapRef, map, center, zoom]);

  // Update markers when shops change
  useEffect(() => {
    if (map && shops && window.google) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = shops.map(shop => {
        if (!shop.latitude || !shop.longitude) return null;
        
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

        return marker;
      }).filter(Boolean);

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

  // Loading state
  if (!isLoaded && !loadError) {
    return (
      <div className={`w-full ${className} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <span className="text-gray-600">กำลังโหลดแผนที่...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className={`w-full ${className} flex items-center justify-center`}>
        <div className="text-center text-red-600">
          <div className="text-xl mb-2">⚠️</div>
          <div>ไม่สามารถโหลดแผนที่ได้</div>
          <div className="text-sm text-gray-500 mt-1">กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</div>
        </div>
      </div>
    );
  }

  const validShops = shops.filter(shop => shop.latitude && shop.longitude);

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
        <div ref={mapRef} className="w-full h-full rounded-lg" />
      </div>
      
      {validShops.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <div>ไม่มีร้านค้าที่มีข้อมูลพิกัด</div>
          <div className="text-sm mt-1">กรุณาเพิ่มข้อมูลพิกัด (ละติจูด/ลองจิจูด) ในร้านค้า</div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsView;