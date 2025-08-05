import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Brain, FileVideo, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AIVideoAnalysisPanel() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analysisMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);

      // Simulate upload progress
      setUploadProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(60);

      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);
      
      if (!response.ok) {
        throw new Error('Video analysis failed');
      }

      setUploadProgress(100);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis Complete",
        description: data.alertCreated 
          ? "Video analyzed and security alert created" 
          : "Video analysis completed successfully",
        variant: data.alertCreated ? "destructive" : "default",
      });
      
      // Refresh alerts and activities if incident was detected
      if (data.alertCreated) {
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      }
      
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze video",
        variant: "destructive",
      });
      setUploadProgress(0);
      setAnalysisResult(null);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Video files must be under 100MB",
        variant: "destructive",
      });
      return;
    }

    analysisMutation.mutate(file);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const clearResults = () => {
    setAnalysisResult(null);
    setUploadProgress(0);
  };

  return (
    <Card className="bg-zb-card border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">AI Video Analysis</CardTitle>
          <Badge className="zb-gradient text-white border-0">
            <Brain className="w-3 h-3 mr-1" />
            Gemini AI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysisResult ? (
          <>
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-zb-accent bg-zb-accent/10' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                className="hidden"
              />
              
              {uploadProgress > 0 ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zb-accent mx-auto"></div>
                  <div className="space-y-2">
                    <p className="text-slate-300">Analyzing video with AI...</p>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-slate-400">{uploadProgress}% complete</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileVideo className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-slate-300 mb-2">Drop video file here or click to upload</p>
                    <p className="text-sm text-slate-500">MP4, AVI, MOV files up to 100MB</p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analysisMutation.isPending}
                    className="bg-zb-accent hover:bg-blue-600 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Video
                  </Button>
                </div>
              )}
            </div>

            {/* Analysis Info */}
            <div className="bg-zb-dark rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">AI Analysis Capabilities</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>• Person detection & tracking</div>
                <div>• Vehicle identification</div>
                <div>• Object recognition</div>
                <div>• Motion pattern analysis</div>
                <div>• Security incident detection</div>
                <div>• Behavioral analysis</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Analysis Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Analysis Results</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearResults}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Incident Analysis */}
              {analysisResult.incidentAnalysis && (
                <div className="bg-zb-dark rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Incident Detection</h4>
                    <Badge className={getSeverityColor(analysisResult.incidentAnalysis.severity)}>
                      {analysisResult.incidentAnalysis.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300">
                      <strong>Type:</strong> {analysisResult.incidentAnalysis.type}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Summary:</strong> {analysisResult.incidentAnalysis.summary}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Confidence:</strong> {Math.round(analysisResult.incidentAnalysis.confidence * 100)}%
                    </p>
                  </div>

                  {analysisResult.incidentAnalysis.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-white mb-2">Recommendations:</p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {analysisResult.incidentAnalysis.recommendations.map((rec: string, index: number) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.alertCreated && (
                    <div className="flex items-center text-sm text-orange-400">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Security alert created automatically
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Analysis */}
              <div className="bg-zb-dark rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Detailed Analysis</h4>
                <Textarea
                  value={analysisResult.analysis}
                  readOnly
                  className="bg-zb-darker text-slate-300 border-slate-700 text-sm h-32 resize-none"
                />
              </div>

              {/* Success Indicator */}
              <div className="flex items-center text-sm text-green-400">
                <CheckCircle className="w-4 h-4 mr-2" />
                Analysis completed successfully
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}