/**
 * Points Manager Component
 *
 * @module PointsManager
 * @description Component for managing points - purchasing and viewing balance
 */
import { clientLogger as logger } from '@shared/services';
import type { PointBalance, PointPurchaseOption } from '@shared/types';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import { usePurchasePoints } from '../../hooks/api/usePoints';
import { apiService } from '../../services/api';
import { PointsManagerProps } from '../../types';

export const PointsManager: React.FC<PointsManagerProps> = ({ onClose }) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  // Fetch point balance
  const { data: pointBalance, isLoading: balanceLoading } = useQuery<PointBalance>({
    queryKey: ['pointBalance'],
    queryFn: () => apiService.getPointBalance(),
  });

  // Fetch point packages
  const { data: pointPackages, isLoading: packagesLoading } = useQuery<PointPurchaseOption[]>({
    queryKey: ['pointPackages'],
    queryFn: () => apiService.getPointPackages(),
  });

  const purchasePointsMutation = usePurchasePoints();

  const handlePurchase = async () => {
    if (!selectedPackage) {
      logger.userError('No package selected');
      return;
    }

    try {
      await purchasePointsMutation.mutateAsync(selectedPackage);
      logger.userInfo('Points purchased successfully');
    } catch (error) {
      logger.userError('Failed to purchase points', { error });
    }
  };

  if (balanceLoading || packagesLoading) {
    return (
      <div className='bg-white rounded-lg shadow-md p-6 max-w-md mx-auto'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mb-4'></div>
          <div className='h-4 bg-gray-200 rounded w-2/3'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6 max-w-md mx-auto'>
      <h2 className='text-2xl font-bold text-gray-800 mb-6'>ניהול נקודות</h2>

      {/* Current Balance */}
      <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
        <h3 className='text-lg font-semibold text-blue-800 mb-2'>יתרת נקודות נוכחית</h3>
        <div className='text-2xl font-bold text-blue-600'>
          {pointBalance?.total_points || 0} נקודות
        </div>
        <div className='text-sm text-blue-500'>
          נקודות שנרכשו: {pointBalance?.purchased_points || 0}
        </div>
      </div>

      {/* Purchase Packages */}
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>חבילות נקודות</h3>
        <div className='space-y-3'>
          {pointPackages?.map(pkg => (
            <div
              key={pkg.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPackage === pkg.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              <div className='flex justify-between items-center'>
                <div>
                  <div className='font-semibold text-gray-800'>{pkg.points} נקודות</div>
                  <div className='text-sm text-gray-600'>{pkg.description}</div>
                </div>
                <div className='text-lg font-bold text-green-600'>${pkg.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex space-x-4'>
        <button
          onClick={handlePurchase}
          disabled={!selectedPackage || purchasePointsMutation.isPending}
          className='flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50'
        >
          {purchasePointsMutation.isPending ? 'רוכש...' : 'רכוש נקודות'}
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500'
          >
            סגור
          </button>
        )}
      </div>

      {/* Status Messages */}
      {purchasePointsMutation.isError && (
        <div className='mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          שגיאה ברכישת נקודות. נסה שוב.
        </div>
      )}

      {purchasePointsMutation.isSuccess && (
        <div className='mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
          הנקודות נרכשו בהצלחה!
        </div>
      )}
    </div>
  );
};
