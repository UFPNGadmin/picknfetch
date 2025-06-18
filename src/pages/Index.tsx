
import { useState } from 'react';
import ZipExplorer from '../components/ZipExplorer';
import BannerAd from '../components/ads/BannerAd';
import SidebarAd from '../components/ads/SidebarAd';
import InlineAd from '../components/ads/InlineAd';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [zipUrl, setZipUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [zipData, setZipData] = useState(null);
  const [explorationLog, setExplorationLog] = useState<string[]>([]);
  const { toast } = useToast();

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true);
    setZipUrl(url);
    
    // Add to exploration log immediately when user clicks explore
    const logEntry = `Starting exploration of ZIP: ${url} at ${new Date().toLocaleTimeString()}`;
    setExplorationLog(prev => [logEntry, ...prev.slice(0, 9)]);
    
    try {
      console.log('Fetching ZIP data for:', url);
      
      const { data, error } = await supabase.functions.invoke('fetch-zip', {
        body: { zipUrl: url }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch ZIP file');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process ZIP file');
      }

      console.log('ZIP data received:', data);
      setZipData(data);
      
      const successLog = `Successfully loaded ${data.totalFiles} files from ZIP archive at ${new Date().toLocaleTimeString()}`;
      setExplorationLog(prev => [successLog, ...prev.slice(0, 9)]);
      
      toast({
        title: "ZIP file loaded successfully",
        description: `Found ${data.totalFiles} files`,
      });
      
    } catch (error) {
      console.error('Error loading ZIP:', error);
      const errorLog = `Failed to load ZIP: ${error instanceof Error ? error.message : 'Unknown error'} at ${new Date().toLocaleTimeString()}`;
      setExplorationLog(prev => [errorLog, ...prev.slice(0, 9)]);
      
      toast({
        title: "Error loading ZIP file",
        description: error instanceof Error ? error.message : "Please check the URL and try again",
        variant: "destructive",
      });
      setZipData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <BannerAd />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Remote ZIP Explorer
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore and download files from remote ZIP archives without downloading the entire file
              </p>
            </div>

            {!zipData ? (
              <>
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                      Enter ZIP File URL
                    </h2>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      const url = formData.get('zipUrl') as string;
                      if (url.trim()) {
                        handleUrlSubmit(url.trim());
                      }
                    }} className="space-y-6">
                      <div>
                        <label htmlFor="zipUrl" className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP File URL
                        </label>
                        <input
                          type="url"
                          id="zipUrl"
                          name="zipUrl"
                          placeholder="https://example.com/archive.zip"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          required
                          disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter a direct link to a ZIP file
                        </p>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Loading ZIP...
                          </div>
                        ) : (
                          'Explore ZIP File'
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto mt-8">
                  <InlineAd />
                </div>

                {/* Exploration Log - Shows immediately when user clicks explore */}
                {explorationLog.length > 0 && (
                  <div className="max-w-2xl mx-auto mt-8">
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Log</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {explorationLog.map((log, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <ZipExplorer zipData={zipData} zipUrl={zipUrl} onBack={() => setZipData(null)} />
            )}
          </div>

          {/* Sidebar with ads and info */}
          <div className="lg:w-80 space-y-6">
            <SidebarAd />
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                How It Works
              </h3>
              <ol className="text-sm text-gray-600 space-y-3">
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold mr-3 px-2 py-1 rounded-full mt-0.5">1</span>
                  <span>Enter a direct ZIP file URL</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold mr-3 px-2 py-1 rounded-full mt-0.5">2</span>
                  <span>Click "Explore ZIP File" to load contents</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold mr-3 px-2 py-1 rounded-full mt-0.5">3</span>
                  <span>Browse the complete file structure</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold mr-3 px-2 py-1 rounded-full mt-0.5">4</span>
                  <span>Select any file to download</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold mr-3 px-2 py-1 rounded-full mt-0.5">5</span>
                  <span>Watch a short ad and download instantly</span>
                </li>
              </ol>
            </div>

            <SidebarAd />

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Why Use This Tool?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>No need to download entire ZIP files</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Save bandwidth and storage space</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Preview ZIP contents before downloading</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Extract individual files instantly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
