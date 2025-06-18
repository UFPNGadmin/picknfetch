import { useState } from 'react';
import { ArrowDown, Download, FileArchive, ArrowLeft } from 'lucide-react';
import FileTree from './FileTree';
import RewardedAdModal from './ads/RewardedAdModal';
import InlineAd from './ads/InlineAd';
import SidebarAd from './ads/SidebarAd';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ZipExplorerProps {
  zipData: any;
  zipUrl: string;
  onBack: () => void;
}

const ZipExplorer = ({ zipData, zipUrl, onBack }: ZipExplorerProps) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [downloadLogs, setDownloadLogs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: any) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  const handleDownloadRequest = () => {
    if (selectedFile) {
      setShowAdModal(true);
    }
  };

  const handleAdCompleted = async () => {
    setShowAdModal(false);
    if (selectedFile) {
      setIsDownloading(true);
      
      try {
        console.log('Starting download for:', selectedFile.name);
        
        // Call the download edge function with the full file path
        const { data, error } = await supabase.functions.invoke('download-file', {
          body: { 
            zipUrl: zipUrl,
            fileName: selectedFile.name, // Use the full path from the file tree
            fileSize: selectedFile.size || 0,
            compressedSize: selectedFile.compressedSize || 0
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to download file');
        }

        if (!data.success) {
          throw new Error(data.error || 'Download failed');
        }

        // Convert base64 to blob and trigger download
        const binaryString = atob(data.fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.name.split('/').pop() || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update download logs
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `${timestamp} - Downloaded: ${selectedFile.name} (${formatFileSize(selectedFile.size || 0)})${selectedFile.encrypted ? ' [ENCRYPTED]' : ''}`;
        setDownloadLogs(prev => [logMessage, ...prev.slice(0, 9)]);
        
        toast({
          title: "Download completed",
          description: `${selectedFile.name} has been downloaded successfully`,
        });
        
        setSelectedFile(null);
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download failed",
          description: error instanceof Error ? error.message : "Failed to download file",
          variant: "destructive",
        });
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalFiles = (files: any[]): number => {
    return files.reduce((count, file) => {
      if (file.type === 'file') {
        return count + 1;
      } else if (file.children) {
        return count + getTotalFiles(file.children);
      }
      return count;
    }, 0);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileArchive className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">ZIP Contents</h2>
                    <p className="text-purple-100 text-sm truncate max-w-md">
                      {zipUrl}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onBack}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              </div>
              
              <div className="mt-4 flex items-center space-x-6 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {getTotalFiles(zipData.files)} files
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {zipData.files.filter((f: any) => f.type === 'folder').length} folders
                </span>
                {zipData.totalSize && (
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {formatFileSize(zipData.totalSize)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* File Tree */}
              <div className="flex-1 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">File Structure</h3>
                
                <div className="mb-6">
                  <InlineAd />
                </div>
                
                <FileTree 
                  files={zipData.files} 
                  onFileSelect={handleFileSelect} 
                  selectedFile={selectedFile}
                />
                
                <div className="mt-6">
                  <InlineAd />
                </div>
              </div>

              {/* Selected File & Download Panel */}
              <div className="lg:w-80 bg-gray-50 p-6 border-l border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Download Panel</h3>
                
                {selectedFile ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Selected File</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p>Size: {formatFileSize(selectedFile.size || 0)}</p>
                      {selectedFile.compressedSize && (
                        <p>Compressed: {formatFileSize(selectedFile.compressedSize)}</p>
                      )}
                      {selectedFile.date && <p>Date: {selectedFile.date}</p>}
                      {selectedFile.encrypted && (
                        <p className="text-red-600 font-medium">🔒 Encrypted</p>
                      )}
                    </div>
                    
                    <button
                      onClick={handleDownloadRequest}
                      disabled={isDownloading}
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4" />
                      <span>{isDownloading ? 'Downloading...' : 'Download File'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4 text-center">
                    <ArrowDown className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Select a file from the tree to download
                    </p>
                  </div>
                )}

                {/* Download Logs */}
                {downloadLogs.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Recent Downloads</h4>
                    <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                      {downloadLogs.map((log, index) => (
                        <div key={index} className="text-gray-600 bg-gray-50 p-2 rounded border-l-4 border-green-400">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with ads */}
        <div className="lg:w-80 space-y-4">
          <SidebarAd />
          <SidebarAd />
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Use</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Browse the file structure on the left</li>
              <li>2. Click on any file to select it</li>
              <li>3. Click "Download File" button</li>
              <li>4. Watch a short ad to unlock download</li>
              <li>5. File will download automatically</li>
            </ol>
          </div>
          
          <SidebarAd />
        </div>
      </div>

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onAdCompleted={handleAdCompleted}
      />
    </div>
  );
};

export default ZipExplorer;
