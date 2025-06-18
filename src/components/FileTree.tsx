
import { useState } from 'react';
import { FileArchive, File, Folder, FolderOpen } from 'lucide-react';

interface FileTreeProps {
  files: any[];
  onFileSelect: (file: any) => void;
  selectedFile?: any;
  level?: number;
}

const FileTree = ({ files, onFileSelect, selectedFile, level = 0 }: FileTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'zip' || ext === 'rar' || ext === '7z') {
      return <FileArchive className="h-4 w-4 text-orange-500" />;
    }
    
    return <File className="h-4 w-4 text-blue-500" />;
  };

  const isSelected = (file: any) => {
    return selectedFile && selectedFile.name === file.name && file.type === 'file';
  };

  return (
    <div className="space-y-1">
      {files.map((file, index) => (
        <div key={`${file.name}-${index}`}>
          {file.type === 'folder' ? (
            <>
              <div
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors duration-150"
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={() => toggleFolder(file.name)}
              >
                {expandedFolders.has(file.name) ? (
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-gray-800 font-medium">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({file.children?.length || 0} items)
                </span>
              </div>
              
              {expandedFolders.has(file.name) && file.children && (
                <FileTree
                  files={file.children}
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  level={level + 1}
                />
              )}
            </>
          ) : (
            <div
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-150 group ${
                isSelected(file) 
                  ? 'bg-blue-100 border-2 border-blue-400 shadow-sm' 
                  : 'hover:bg-blue-50'
              }`}
              style={{ paddingLeft: `${level * 20 + 8}px` }}
              onClick={() => onFileSelect(file)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {getFileIcon(file.name)}
                <span className={`truncate ${isSelected(file) ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                  {file.name}
                </span>
                {file.encrypted && (
                  <span className="text-red-600 text-xs font-semibold">🔒</span>
                )}
              </div>
              
              <div className={`flex items-center space-x-3 text-xs transition-opacity duration-150 ${
                isSelected(file) ? 'text-blue-600 opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'
              }`}>
                <span>{formatFileSize(file.size || 0)}</span>
                <span>{file.date}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileTree;
