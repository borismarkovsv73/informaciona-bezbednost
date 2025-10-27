'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Certificate } from '@/types';
import { 
  Award, 
  AlertCircle, 
  Download, 
  Trash2, 
  Eye,
  Plus,
  Search
} from 'lucide-react';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const router = useRouter();

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, filterType]);

  const fetchCertificates = async () => {
    try {
      const response = await api.get('/certificates');
      setCertificates(response.data);
    } catch (err) {
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const filterCertificates = () => {
    let filtered = certificates;

    // Filter by type
    if (filterType !== 'ALL') {
      if (filterType === 'ACTIVE') {
        filtered = filtered.filter(cert => !cert.revoked);
      } else if (filterType === 'REVOKED') {
        filtered = filtered.filter(cert => cert.revoked);
      } else {
        filtered = filtered.filter(cert => cert.type === filterType);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCertificates(filtered);
  };

  const handleRevoke = async (serialNumber: string) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) {
      return;
    }

    try {
      await api.post(`/certificates/${serialNumber}/revoke`);
      fetchCertificates();
    } catch (err) {
      setError('Failed to revoke certificate');
    }
  };

  const handleDownload = async (serialNumber: string, format: 'PKCS12' | 'JKS') => {
    try {
      const response = await api.get(`/certificates/${serialNumber}/download/${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate_${serialNumber}.${format.toLowerCase() === 'pkcs12' ? 'p12' : 'jks'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar>
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
                <p className="mt-2 text-gray-600">Manage your PKI certificates</p>
              </div>
              <button
                onClick={() => router.push('/certificates/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Certificate
              </button>
            </div>
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

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Certificates</option>
              <option value="ACTIVE">Active Only</option>
              <option value="REVOKED">Revoked Only</option>
              <option value="SELF_SIGNED_ROOT">Root CA</option>
              <option value="INTERMEDIATE">Intermediate CA</option>
              <option value="END_ENTITY">End Entity</option>
            </select>
          </div>

          {/* Certificates Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredCertificates.map((certificate) => (
                <li key={certificate.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <Award className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {certificate.commonName}
                            </h3>
                            <div className="text-sm text-gray-500 space-y-1">
                              <p>Organization: {certificate.organization}</p>
                              <p>Serial: {certificate.serialNumber}</p>
                              <p>Type: {certificate.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              <p>Issued: {new Date(certificate.issuedAt).toLocaleDateString()}</p>
                              <p>Expires: {new Date(certificate.expiresAt).toLocaleDateString()}</p>
                            </div>
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  certificate.revoked
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {certificate.revoked ? 'Revoked' : 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex items-center space-x-2">
                      <div className="relative inline-block text-left">
                        <select
                          className="block w-full px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleDownload(certificate.serialNumber, e.target.value as 'PKCS12' | 'JKS');
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Download</option>
                          <option value="PKCS12">PKCS12 (.p12)</option>
                          <option value="JKS">JKS (.jks)</option>
                        </select>
                      </div>
                      {!certificate.revoked && (
                        <button
                          onClick={() => handleRevoke(certificate.serialNumber)}
                          className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {filteredCertificates.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Award className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No certificates found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterType !== 'ALL' 
                    ? 'Try adjusting your search or filters.'
                    : 'Get started by creating your first certificate.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </Navbar>
    </ProtectedRoute>
  );
}