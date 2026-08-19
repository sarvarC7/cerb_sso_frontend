'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getToken, getUser, removeToken, type User } from '@/lib/auth';
import { Search, RefreshCw, ChevronRight, FileText, TrendingUp, Shield, AlertCircle, CheckCircle, BarChart3, Home } from 'lucide-react';

interface Report {
  _id: string;
  overallConclusion: string;
  securityScore: number;
  testCoverage: number;
  keyFindings: Array<{
    title: string;
    description: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  createdAt?: string;
  updatedAt?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBadgeVariant = (score: number) => {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  if (score >= 40) return 'outline';
  return 'destructive';
};

export default function ReportingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const userData = getUser();

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchReports(token);
  }, [router]);

  const filterAndSortReports = useCallback(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.overallConclusion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.keyFindings.some(finding => 
          finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          finding.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        report.strengths.some(strength => strength.toLowerCase().includes(searchTerm.toLowerCase())) ||
        report.weaknesses.some(weakness => weakness.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (scoreFilter !== 'all') {
      switch (scoreFilter) {
        case 'excellent':
          filtered = filtered.filter(report => report.securityScore >= 80);
          break;
        case 'good':
          filtered = filtered.filter(report => report.securityScore >= 60 && report.securityScore < 80);
          break;
        case 'fair':
          filtered = filtered.filter(report => report.securityScore >= 40 && report.securityScore < 60);
          break;
        case 'poor':
          filtered = filtered.filter(report => report.securityScore < 40);
          break;
      }
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.updatedAt || a.createdAt || '').getTime() - new Date(b.updatedAt || b.createdAt || '').getTime());
        break;
      case 'score-high':
        filtered.sort((a, b) => b.securityScore - a.securityScore);
        break;
      case 'score-low':
        filtered.sort((a, b) => a.securityScore - b.securityScore);
        break;
      case 'coverage-high':
        filtered.sort((a, b) => b.testCoverage - a.testCoverage);
        break;
      case 'coverage-low':
        filtered.sort((a, b) => a.testCoverage - b.testCoverage);
        break;
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, scoreFilter, sortBy]);

  useEffect(() => {
    filterAndSortReports();
  }, [filterAndSortReports]);

  const fetchReports = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/reporting', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setReports(Array.isArray(data) ? data : data.data || []);
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
      fetchReports(token);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const averageScore = reports.length > 0 ? reports.reduce((sum, r) => sum + r.securityScore, 0) / reports.length : 0;
  const averageCoverage = reports.length > 0 ? reports.reduce((sum, r) => sum + r.testCoverage, 0) / reports.length : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reporting</h1>
            <p className="text-muted-foreground mt-1">
              Security assessment reports and insights
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
                    placeholder="Search reports by conclusion, findings, strengths, or weaknesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Scores</option>
                  <option value="excellent">Excellent (80+)</option>
                  <option value="good">Good (60-79)</option>
                  <option value="fair">Fair (40-59)</option>
                  <option value="poor">Poor (&lt;40)</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score-high">Highest Score</option>
                  <option value="score-low">Lowest Score</option>
                  <option value="coverage-high">Best Coverage</option>
                  <option value="coverage-low">Worst Coverage</option>
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
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{reports.length}</div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{filteredReports.length}</div>
                  <p className="text-sm text-muted-foreground">Filtered Results</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore.toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Security Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{averageCoverage.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Avg Test Coverage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reports found matching your criteria.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <CardTitle className="text-xl">Security Assessment Report</CardTitle>
                        <Badge variant={getScoreBadgeVariant(report.securityScore)}>
                          Score: {report.securityScore}%
                        </Badge>
                      </div>
                      <CardDescription>
                        Test Coverage: {report.testCoverage}% • Created: {formatDate(report.createdAt)}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Overall Conclusion */}
                    <div>
                      <h4 className="font-semibold mb-2">Overall Conclusion</h4>
                      <p className="text-sm text-muted-foreground">{report.overallConclusion}</p>
                    </div>

                    {/* Key Findings */}
                    {report.keyFindings.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Key Findings ({report.keyFindings.length})
                        </h4>
                        <div className="space-y-2">
                          {report.keyFindings.slice(0, 3).map((finding, index) => (
                            <div key={index} className="border-l-4 border-orange-200 pl-3">
                              <p className="font-medium text-sm">{finding.title}</p>
                              <p className="text-xs text-muted-foreground">{finding.description}</p>
                            </div>
                          ))}
                          {report.keyFindings.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{report.keyFindings.length - 3} more findings...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Strengths and Weaknesses */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Strengths ({report.strengths.length})
                        </h4>
                        <ul className="space-y-1">
                          {report.strengths.slice(0, 3).map((strength, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                          {report.strengths.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{report.strengths.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          Weaknesses ({report.weaknesses.length})
                        </h4>
                        <ul className="space-y-1">
                          {report.weaknesses.slice(0, 3).map((weakness, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                          {report.weaknesses.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{report.weaknesses.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Score Bars */}
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Security Score</span>
                          <span className={getScoreColor(report.securityScore)}>{report.securityScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${report.securityScore >= 80 ? 'bg-green-500' : report.securityScore >= 60 ? 'bg-yellow-500' : report.securityScore >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${report.securityScore}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Test Coverage</span>
                          <span>{report.testCoverage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${report.testCoverage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 