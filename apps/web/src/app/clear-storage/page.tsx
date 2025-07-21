'use client';

import React, { useState } from 'react';
import { TokenStorage } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ClearStoragePage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  const clearStorage = () => {
    try {
      TokenStorage.clearTokens();
      localStorage.clear();
      sessionStorage.clear();
      setCleared(true);
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Limpiar Datos Almacenados
        </h1>
        
        {!cleared ? (
          <>
            <p className="text-gray-600 mb-6">
              Si tienes problemas con el login, puedes limpiar todos los datos almacenados 
              en tu navegador y comenzar de nuevo.
            </p>
            
            <button
              onClick={clearStorage}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Limpiar Todos los Datos
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Esto cerrará tu sesión y eliminará todos los datos locales.
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">
              ¡Datos limpiados exitosamente!
            </p>
            <p className="text-gray-600 mt-2">
              Redirigiendo a la página principal...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}