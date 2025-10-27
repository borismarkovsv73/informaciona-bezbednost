'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Certificate, CertificateRequest } from '@/types';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function CreateCertificatePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CertificateRequest>({
    defaultValues: {
      validityYears: 1,
      type: 'SELF_SIGNED_ROOT',
    },
  });

  const certificateType = watch('type');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await api.get('/certificates');
      // Filter only active certificates that can be issuers
      const activeCertificates = response.data.filter(
        (cert: Certificate) => !cert.revoked && (cert.type === 'SELF_SIGNED_ROOT' || cert.type === 'INTERMEDIATE')
      );
      setCertificates(activeCertificates);
    } catch (err) {
      console.error('Failed to load certificates', err);
    }
  };

  const onSubmit = async (data: CertificateRequest) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/certificates', data);
      setSuccess(`Certificate created successfully! Serial: ${response.data.serialNumber}`);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create certificate');
    } finally {
      setLoading(false);
    }
  };

  const requiresIssuer = certificateType === 'INTERMEDIATE' || certificateType === 'END_ENTITY';

  return (
    <ProtectedRoute>
      <Navbar>
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create Certificate</h1>
            <p className="mt-2 text-gray-600">Issue a new certificate in your PKI</p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">{success}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Certificate Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate Type
                  </label>
                  <select
                    {...register('type', { required: 'Certificate type is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="SELF_SIGNED_ROOT">Self-Signed Root CA</option>
                    <option value="INTERMEDIATE">Intermediate CA</option>
                    <option value="END_ENTITY">End Entity Certificate</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                {/* Issuer Selection (for Intermediate and End Entity) */}
                {requiresIssuer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Issuer Certificate
                    </label>
                    <select
                      {...register('issuerSerialNumber', { 
                        required: requiresIssuer ? 'Issuer certificate is required' : false 
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select an issuer certificate</option>
                      {certificates.map((cert) => (
                        <option key={cert.serialNumber} value={cert.serialNumber}>
                          {cert.commonName} ({cert.type}) - {cert.serialNumber.substring(0, 8)}...
                        </option>
                      ))}
                    </select>
                    {errors.issuerSerialNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.issuerSerialNumber.message}</p>
                    )}
                  </div>
                )}

                {/* Subject Information */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Common Name (CN)
                    </label>
                    <input
                      type="text"
                      {...register('commonName', { required: 'Common Name is required' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="example.com"
                    />
                    {errors.commonName && (
                      <p className="mt-1 text-sm text-red-600">{errors.commonName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Organization (O)
                    </label>
                    <input
                      type="text"
                      {...register('organization', { required: 'Organization is required' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Example Corporation"
                    />
                    {errors.organization && (
                      <p className="mt-1 text-sm text-red-600">{errors.organization.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Organizational Unit (OU)
                    </label>
                    <input
                      type="text"
                      {...register('organizationalUnit', { required: 'Organizational Unit is required' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="IT Department"
                    />
                    {errors.organizationalUnit && (
                      <p className="mt-1 text-sm text-red-600">{errors.organizationalUnit.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country (C)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      {...register('country', { 
                        required: 'Country is required',
                        maxLength: { value: 2, message: 'Country code must be 2 characters' },
                        minLength: { value: 2, message: 'Country code must be 2 characters' }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="US"
                    />
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      State/Province (ST)
                    </label>
                    <input
                      type="text"
                      {...register('state', { required: 'State/Province is required' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="California"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Locality (L)
                    </label>
                    <input
                      type="text"
                      {...register('locality', { required: 'Locality is required' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="San Francisco"
                    />
                    {errors.locality && (
                      <p className="mt-1 text-sm text-red-600">{errors.locality.message}</p>
                    )}
                  </div>
                </div>

                {/* Validity Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Validity Period (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    {...register('validityYears', { 
                      required: 'Validity period is required',
                      min: { value: 1, message: 'Minimum validity is 1 year' },
                      max: { value: 30, message: 'Maximum validity is 30 years' }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.validityYears && (
                    <p className="mt-1 text-sm text-red-600">{errors.validityYears.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Certificate'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Navbar>
    </ProtectedRoute>
  );
}