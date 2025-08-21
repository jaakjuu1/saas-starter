'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, Download, RefreshCw, Zap, BarChart3, Target, Rocket } from 'lucide-react';

interface ReportStatus {
  report: {
    id: number;
    domain: string;
    reportType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    reportData?: any;
    pdfUrl?: string;
  };
  job: {
    id: number;
    jobId: string;
    status: string;
    progress: number;
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
  } | null;
  queue?: any;
}

const reportTierInfo = {
  lite: { name: 'Lite Report', icon: Zap, color: 'text-blue-600' },
  pro: { name: 'Pro Report', icon: BarChart3, color: 'text-purple-600' },
  elite: { name: 'Elite Report', icon: Target, color: 'text-orange-600' },
  tasklist_pro: { name: 'Tasklist Pro', icon: Rocket, color: 'text-green-600' },
};

const getProgressMessage = (progress: number, status: string): string => {
  if (status === 'completed') return 'Report generation completed!';
  if (status === 'failed') return 'Report generation failed';
  if (progress === 0) return 'Initializing report generation...';
  if (progress <= 25) return 'Analyzing website structure and content...';
  if (progress <= 50) return 'Running technical SEO audit...';
  if (progress <= 75) return 'Analyzing page performance metrics...';
  if (progress <= 90) return 'Generating comprehensive report...';
  return 'Finalizing report...';
};

export default function ReportStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reportId = params.id as string;
  const isSuccess = searchParams.get('success') === 'true';
  
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/status`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Report not found');
        } else if (response.status === 401) {
          setError('You need to be logged in to view this report');
        } else {
          setError('Failed to load report status');
        }
        return;
      }
      
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError('Failed to load report status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for updates every 3 seconds if report is still processing
    const interval = setInterval(() => {
      if (status && status.report.status !== 'completed' && status.report.status !== 'failed') {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [reportId, status?.report.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading report status...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const { report, job } = status;
  const tierInfo = reportTierInfo[report.reportType as keyof typeof reportTierInfo];
  const Icon = tierInfo.icon;
  
  const progress = job?.progress || 0;
  const isCompleted = report.status === 'completed';
  const isFailed = report.status === 'failed';
  const isProcessing = report.status === 'processing' || report.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Banner */}
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-800">
                Payment successful! Your report is being generated.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4`}>
            <Icon className={`h-8 w-8 ${tierInfo.color}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {tierInfo.name}
          </h1>
          <p className="text-xl text-gray-600">
            for {report.domain}
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-8 mb-8">
          {isCompleted && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Report Ready!
              </h2>
              <p className="text-gray-600 mb-6">
                Your comprehensive website analysis is complete.
              </p>
              {report.pdfUrl && (
                <Button size="lg" className="bg-green-500 hover:bg-green-600">
                  <Download className="mr-2 h-5 w-5" />
                  Download Report (PDF)
                </Button>
              )}
            </div>
          )}

          {isFailed && (
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Generation Failed
              </h2>
              <p className="text-gray-600 mb-4">
                We encountered an issue generating your report.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {job?.errorMessage || 'Please contact support for assistance.'}
              </p>
              <Button variant="outline" onClick={fetchStatus}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-orange-500 transition-all duration-500 ease-out"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${
                        50 + 50 * Math.cos((progress / 100) * 2 * Math.PI - Math.PI / 2)
                      }% ${
                        50 + 50 * Math.sin((progress / 100) * 2 * Math.PI - Math.PI / 2)
                      }%, 50% 50%)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{progress}%</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Generating Your Report
                </h2>
                <p className="text-gray-600 mb-4">
                  {getProgressMessage(progress, report.status)}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                {[
                  { step: 'Website Analysis', range: [0, 25], icon: '🔍' },
                  { step: 'SEO Audit', range: [25, 50], icon: '🔧' },
                  { step: 'Performance Check', range: [50, 75], icon: '⚡' },
                  { step: 'Report Generation', range: [75, 100], icon: '📊' },
                ].map(({ step, range, icon }, index) => {
                  const isActive = progress > range[0] && progress <= range[1];
                  const isCompleted = progress > range[1];
                  
                  return (
                    <div key={step} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : isActive 
                          ? 'bg-orange-100 text-orange-600 animate-pulse' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? '✓' : isActive ? icon : icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          isCompleted 
                            ? 'text-green-600' 
                            : isActive 
                            ? 'text-orange-600' 
                            : 'text-gray-400'
                        }`}>
                          {step}
                        </div>
                      </div>
                      {isActive && (
                        <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
                      )}
                      {isCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Report Details */}
        {isCompleted && report.reportData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Report Summary
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {report.reportData.analysis && (
                <>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {report.reportData.analysis.seo?.score || 'N/A'}
                    </div>
                    <div className="text-sm text-blue-600">SEO Score</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {report.reportData.analysis.performance?.score || 'N/A'}
                    </div>
                    <div className="text-sm text-purple-600">Performance</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {report.reportData.analysis.website?.score || 'N/A'}
                    </div>
                    <div className="text-sm text-green-600">Overall Score</div>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Meta Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Report created on {new Date(report.createdAt).toLocaleDateString()}</p>
          {isCompleted && report.completedAt && (
            <p>Completed on {new Date(report.completedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}