'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getToken, getUser, removeToken, type User } from '@/lib/auth';
import { Search, RefreshCw, ChevronRight, AlertTriangle, Activity, Bug, Zap, Home } from 'lucide-react';

interface Vulnerability {
  _id: string;
  name: string;
  vector: 'person' | 'web' | 'mobile_application' | 'network';
  cvssScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'mitigated' | 'opened';
  priority: 'critical' | 'high' | 'medium' | 'low';
  complexity: 'low' | 'medium' | 'high' | 'insane';
  discoveryDate: string;
  attackStartDate: string;
  affectedComponents: string[];
  associatedScopeAsset: string;
  attackVector: {
    assets: string[];
    edges: {
      from: number;
      to: number;
    };
  };
  description: string;
  stepsToReproduce: string[];
  stepsToRemediate: string[];
  discoveryNotes?: string;
  references: string[];
}

const severityColors = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
};

const severityIcons = {
  critical: Zap,
  high: AlertTriangle,
  medium: Activity,
  low: Bug,
};

const statusColors = {
  opened: 'bg-red-50 text-red-700 border-red-200',
  mitigated: 'bg-green-50 text-green-700 border-green-200',
};

const vectorIcons = {
  person: '👤',
  web: '🌐',
  mobile_application: '📱',
  network: '🌐',
};

export default function VulnerabilitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<Vulnerability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVector, setSelectedVector] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const userData = getUser();

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchVulnerabilities(token);
  }, [router]);

  const filterVulnerabilities = useCallback(() => {
    let filtered = vulnerabilities;

    if (searchTerm) {
      filtered = filtered.filter(vuln =>
        vuln.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.affectedComponents.some(comp => comp.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vuln.discoveryNotes && vuln.discoveryNotes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(vuln => vuln.severity === selectedSeverity);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(vuln => vuln.status === selectedStatus);
    }

    if (selectedVector !== 'all') {
      filtered = filtered.filter(vuln => vuln.vector === selectedVector);
    }

    setFilteredVulnerabilities(filtered);
  }, [vulnerabilities, searchTerm, selectedSeverity, selectedStatus, selectedVector]);

  useEffect(() => {
    filterVulnerabilities();
  }, [filterVulnerabilities]);

  const fetchVulnerabilities = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/vulnerabilities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vulnerabilities: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setVulnerabilities(Array.isArray(data) ? data : data.data || []);
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
      fetchVulnerabilities(token);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading vulnerabilities...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const severities = ['all', 'critical', 'high', 'medium', 'low'];
  const statuses = ['all', 'opened', 'mitigated'];
  const vectors = ['all', ...Array.from(new Set(vulnerabilities.map(vuln => vuln.vector)))];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Vulnerabilities</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage security vulnerabilities
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
                    placeholder="Search vulnerabilities by name, description, or affected components..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {severities.map(severity => (
                    <option key={severity} value={severity}>
                      {severity === 'all' ? 'All Severities' : severity.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedVector}
                  onChange={(e) => setSelectedVector(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {vectors.map(vector => (
                    <option key={vector} value={vector}>
                      {vector === 'all' ? 'All Vectors' : vector.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{vulnerabilities.length}</div>
              <p className="text-sm text-muted-foreground">Total Vulnerabilities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredVulnerabilities.length}</div>
              <p className="text-sm text-muted-foreground">Filtered Results</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {vulnerabilities.filter(v => v.severity === 'critical').length}
              </div>
              <p className="text-sm text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">
                {vulnerabilities.filter(v => v.status === 'opened').length}
              </div>
              <p className="text-sm text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {vulnerabilities.length > 0 ? (vulnerabilities.reduce((sum, v) => sum + v.cvssScore, 0) / vulnerabilities.length).toFixed(1) : '0'}
              </div>
              <p className="text-sm text-muted-foreground">Avg CVSS</p>
            </CardContent>
          </Card>
        </div>

        {/* Vulnerabilities Grid */}
        <div className="grid gap-4">
          {filteredVulnerabilities.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No vulnerabilities found matching your criteria.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredVulnerabilities.map((vuln) => {
              const SeverityIcon = severityIcons[vuln.severity];
              return (
                <Card key={vuln._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-lg border ${severityColors[vuln.severity]}`}>
                          <SeverityIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg truncate">{vuln.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              CVSS {vuln.cvssScore}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {vuln.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={`text-xs ${severityColors[vuln.severity]}`}>
                              {vuln.severity.toUpperCase()}
                            </Badge>
                            <Badge className={`text-xs ${statusColors[vuln.status]}`}>
                              {vuln.status === 'opened' ? 'OPEN' : 'MITIGATED'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {vectorIcons[vuln.vector]} {vuln.vector.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {vuln.complexity.toUpperCase()} Complexity
                            </Badge>
                          </div>

                          <div className="text-sm space-y-1">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Discovered: {formatDate(vuln.discoveryDate)}</span>
                              <span>Components: {vuln.affectedComponents.length}</span>
                            </div>
                            {vuln.affectedComponents.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Affects: {vuln.affectedComponents.slice(0, 3).join(', ')}
                                {vuln.affectedComponents.length > 3 && ` +${vuln.affectedComponents.length - 3} more`}
                              </div>
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