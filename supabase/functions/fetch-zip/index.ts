
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZipEntry {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  compressedSize?: number;
  date?: string;
  children?: ZipEntry[];
  encrypted?: boolean;
  compressionMethod?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipUrl } = await req.json();
    
    if (!zipUrl) {
      return new Response(
        JSON.stringify({ error: 'ZIP URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching ZIP from: ${zipUrl}`);

    // Get file size first
    const headResponse = await fetch(zipUrl, { method: 'HEAD' });
    if (!headResponse.ok) {
      throw new Error(`Failed to get ZIP file info: ${headResponse.status}`);
    }

    const totalSize = parseInt(headResponse.headers.get('Content-Length') || '0');
    if (totalSize === 0) {
      throw new Error('Could not determine ZIP file size');
    }

    console.log(`ZIP file size: ${totalSize} bytes`);

    // Fetch End of Central Directory (EOCD) - last 65KB + 22 bytes
    const eocdSize = Math.min(65558, totalSize); // 22 + 65536
    const eocdStart = totalSize - eocdSize;
    
    const eocdResponse = await fetch(zipUrl, {
      headers: { 'Range': `bytes=${eocdStart}-${totalSize - 1}` }
    });

    if (!eocdResponse.ok) {
      throw new Error(`Failed to fetch EOCD: ${eocdResponse.status}`);
    }

    const eocdData = new Uint8Array(await eocdResponse.arrayBuffer());
    
    // Find EOCD signature (PK\x05\x06) from the end
    let eocdOffset = -1;
    for (let i = eocdData.length - 22; i >= 0; i--) {
      if (eocdData[i] === 0x50 && eocdData[i + 1] === 0x4b && 
          eocdData[i + 2] === 0x05 && eocdData[i + 3] === 0x06) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) {
      throw new Error('EOCD record not found in ZIP file');
    }

    // Parse EOCD record
    const eocdRecord = eocdData.slice(eocdOffset, eocdOffset + 22);
    const dataView = new DataView(eocdRecord.buffer, eocdRecord.byteOffset);
    
    const centralDirSize = dataView.getUint32(12, true); // Central directory size
    const centralDirOffset = dataView.getUint32(16, true); // Central directory offset

    console.log(`Central directory: size=${centralDirSize}, offset=${centralDirOffset}`);

    // Fetch Central Directory
    const cdResponse = await fetch(zipUrl, {
      headers: { 'Range': `bytes=${centralDirOffset}-${centralDirOffset + centralDirSize - 1}` }
    });

    if (!cdResponse.ok) {
      throw new Error(`Failed to fetch Central Directory: ${cdResponse.status}`);
    }

    const cdData = new Uint8Array(await cdResponse.arrayBuffer());
    
    // Parse Central Directory entries
    const files = parseZipCentralDirectory(cdData);
    
    // Organize files into tree structure
    const fileTree = organizeFilesIntoTree(files);

    return new Response(
      JSON.stringify({ 
        success: true, 
        files: fileTree,
        totalSize: totalSize,
        totalFiles: files.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing ZIP:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process ZIP file' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function parseZipCentralDirectory(cdData: Uint8Array): ZipEntry[] {
  const files: ZipEntry[] = [];
  let pos = 0;

  while (pos < cdData.length) {
    // Check Central Directory file header signature
    if (pos + 4 > cdData.length || 
        cdData[pos] !== 0x50 || cdData[pos + 1] !== 0x4b || 
        cdData[pos + 2] !== 0x01 || cdData[pos + 3] !== 0x02) {
      break;
    }

    if (pos + 46 > cdData.length) break;

    const dataView = new DataView(cdData.buffer, cdData.byteOffset + pos);
    
    // Parse Central Directory file header
    const gpFlag = dataView.getUint16(8, true);
    const compressionMethod = dataView.getUint16(10, true);
    const dosTime = dataView.getUint16(12, true);
    const dosDate = dataView.getUint16(14, true);
    const compressedSize = dataView.getUint32(20, true);
    const uncompressedSize = dataView.getUint32(24, true);
    const filenameLength = dataView.getUint16(28, true);
    const extraFieldLength = dataView.getUint16(30, true);
    const commentLength = dataView.getUint16(32, true);

    // Read filename
    const filenameStart = pos + 46;
    if (filenameStart + filenameLength > cdData.length) break;
    
    const filename = new TextDecoder().decode(cdData.slice(filenameStart, filenameStart + filenameLength));

    // Check if encrypted
    const isEncrypted = (gpFlag & 0x1) !== 0;

    // Format date
    const date = formatDosDateTime(dosDate, dosTime);

    // Determine if it's a folder (ends with /)
    const isFolder = filename.endsWith('/');

    files.push({
      name: filename,
      type: isFolder ? 'folder' : 'file',
      size: isFolder ? undefined : uncompressedSize,
      compressedSize: isFolder ? undefined : compressedSize,
      date: date,
      encrypted: isEncrypted,
      compressionMethod: compressionMethod
    });

    // Move to next entry
    pos += 46 + filenameLength + extraFieldLength + commentLength;
  }

  return files;
}

function formatDosDateTime(dosDate: number, dosTime: number): string {
  const year = 1980 + ((dosDate >> 9) & 0x7f);
  const month = (dosDate >> 5) & 0x0f;
  const day = dosDate & 0x1f;
  const hour = (dosTime >> 11) & 0x1f;
  const minute = (dosTime >> 5) & 0x3f;
  
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function organizeFilesIntoTree(files: ZipEntry[]): ZipEntry[] {
  const tree: ZipEntry[] = [];
  const folderMap = new Map<string, ZipEntry>();

  // Create all folders first
  files.forEach(file => {
    if (file.type === 'folder') {
      const pathParts = file.name.split('/').filter(p => p);
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const fullPath = `${currentPath}/`;
        
        if (!folderMap.has(fullPath)) {
          const folder: ZipEntry = {
            name: part,
            type: 'folder',
            children: []
          };
          folderMap.set(fullPath, folder);
          
          if (parentPath) {
            const parent = folderMap.get(`${parentPath}/`);
            if (parent) {
              parent.children!.push(folder);
            }
          } else {
            tree.push(folder);
          }
        }
      });
    }
  });

  // Add files to their respective folders
  files.forEach(file => {
    if (file.type === 'file') {
      const pathParts = file.name.split('/');
      const fileName = pathParts.pop()!;
      
      if (pathParts.length === 0) {
        // Root level file
        tree.push({
          ...file,
          name: fileName
        });
      } else {
        // File in a folder
        const folderPath = pathParts.join('/') + '/';
        const folder = folderMap.get(folderPath);
        
        if (folder) {
          folder.children!.push({
            ...file,
            name: fileName
          });
        } else {
          // Folder doesn't exist, create it
          const missingFolders = [];
          let currentPath = '';
          
          pathParts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const fullPath = `${currentPath}/`;
            
            if (!folderMap.has(fullPath)) {
              const newFolder: ZipEntry = {
                name: part,
                type: 'folder',
                children: []
              };
              folderMap.set(fullPath, newFolder);
              missingFolders.push({ path: fullPath, folder: newFolder });
            }
          });
          
          // Add missing folders to tree
          missingFolders.forEach(({ path, folder }) => {
            const parentPath = path.split('/').slice(0, -2).join('/');
            if (parentPath) {
              const parent = folderMap.get(`${parentPath}/`);
              if (parent) {
                parent.children!.push(folder);
              }
            } else {
              tree.push(folder);
            }
          });
          
          // Add file to its folder
          const targetFolder = folderMap.get(folderPath);
          if (targetFolder) {
            targetFolder.children!.push({
              ...file,
              name: fileName
            });
          }
        }
      }
    }
  });

  return tree;
}
