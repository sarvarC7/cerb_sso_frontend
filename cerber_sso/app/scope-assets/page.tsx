'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getToken, getUser, removeToken, type User } from '@/lib/auth';
import { Search, RefreshCw, ChevronRight, Globe, Server, Shield, User as UserIcon, Package, Building, Home } from 'lucide-react';

interface ScopeAsset {
  _id: string;
  type: 'domain' | 'ip_address' | 'service_on_port' | 'service_object' | 'person' | 'middleware' | 'protection';
  value: string;
  isInternal: boolean;
  shouldntBeDisclosed: boolean;
  visibleToCustomer: boolean;
  parent?: string;
  children: string[];
  description?: string;
  customData?: string;
  relationships: Array<{
    type: string;
    target: string;
  }>;
}

const assetTypeIcons = {
  domain: Globe,
  ip_address: Server,
  service_on_port: Package,
  service_object: Building,
  person: UserIcon,
  middleware: Package,
  protection: Shield,
};

const assetTypeColors = {
  domain: 'bg-blue-50 text-blue-700 border-blue-200',
  ip_address: 'bg-green-50 text-green-700 border-green-200',
  service_on_port: 'bg-purple-50 text-purple-700 border-purple-200',
  service_object: 'bg-orange-50 text-orange-700 border-orange-200',
  person: 'bg-pink-50 text-pink-700 border-pink-200',
  middleware: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  protection: 'bg-red-50 text-red-700 border-red-200',
};

export default function ScopeAssetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<ScopeAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<ScopeAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const userData = getUser();

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchScopeAssets(token);
  }, [router]);

  const filterAssets = useCallback(() => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.customData && asset.customData.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(asset => asset.type === selectedType);
    }

    if (selectedVisibility === 'customer') {
      filtered = filtered.filter(asset => asset.visibleToCustomer);
    } else if (selectedVisibility === 'internal') {
      filtered = filtered.filter(asset => asset.isInternal);
    } else if (selectedVisibility === 'disclosed') {
      filtered = filtered.filter(asset => !asset.shouldntBeDisclosed);
    }

    setFilteredAssets(filtered);
  }, [assets, searchTerm, selectedType, selectedVisibility]);

  useEffect(() => {
    filterAssets();
  }, [filterAssets]);

  const fetchScopeAssets = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/scope-assets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scope assets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAssets(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const handleRefresh = () => {
    const token = getToken();
    if (token) {
      fetchScopeAssets(token);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading scope assets...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const assetTypes = ['all', ...Array.from(new Set(assets.map(asset => asset.type)))];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Scope Assets</h1>
            <p className="text-muted-foreground mt-1">
              Manage and explore your security assessment scope
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets by value, description, or custom data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {assetTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedVisibility}
                  onChange={(e) => setSelectedVisibility(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Visibility</option>
                  <option value="customer">Customer Visible</option>
                  <option value="internal">Internal</option>
                  <option value="disclosed">Disclosed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{assets.length}</div>
              <p className="text-sm text-muted-foreground">Total Assets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredAssets.length}</div>
              <p className="text-sm text-muted-foreground">Filtered Results</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{assets.filter(a => a.isInternal).length}</div>
              <p className="text-sm text-muted-foreground">Internal Assets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{assets.filter(a => a.visibleToCustomer).length}</div>
              <p className="text-sm text-muted-foreground">Customer Visible</p>
            </CardContent>
          </Card>
        </div>

        {/* Assets Grid */}
        <div className="grid gap-4">
          {filteredAssets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No assets found matching your criteria.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAssets.map((asset) => {
              const IconComponent = assetTypeIcons[asset.type];
              return (
                <Card key={asset._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-lg border ${assetTypeColors[asset.type]}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg truncate">{asset.value}</h3>
                            <Badge variant="outline" className="text-xs">
                              {asset.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {asset.description && (
                            <p className="text-sm text-muted-foreground mb-2">{asset.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            {asset.isInternal && (
                              <Badge variant="secondary" className="text-xs">Internal</Badge>
                            )}
                            {asset.visibleToCustomer && (
                              <Badge variant="outline" className="text-xs">Customer Visible</Badge>
                            )}
                            {asset.shouldntBeDisclosed && (
                              <Badge variant="destructive" className="text-xs">Not Disclosed</Badge>
                            )}
                            {asset.children.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {asset.children.length} Children
                              </Badge>
                            )}
                            {asset.relationships.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {asset.relationships.length} Relations
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 