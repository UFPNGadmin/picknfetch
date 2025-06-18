
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipUrl, fileName, fileSize, compressedSize } = await req.json();
    
    if (!zipUrl || !fileName) {
      return new Response(
        JSON.stringify({ error: 'ZIP URL and file name are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Downloading file: ${fileName} from ZIP: ${zipUrl}`);

    // Get file size first
    const headResponse = await fetch(zipUrl, { method: 'HEAD' });
    if (!headResponse.ok) {
      throw new Error(`Failed to get ZIP file info: ${headResponse.status}`);
    }

    const totalSize = parseInt(headResponse.headers.get('Content-Length') || '0');
    if (totalSize === 0) {
      throw new Error('Could not determine ZIP file size');
    }

    // Fetch End of Central Directory (EOCD)
    const eocdSize = Math.min(65558, totalSize);
    const eocdStart = totalSize - eocdSize;
    
    const eocdResponse = await fetch(zipUrl, {
      headers: { 'Range': `bytes=${eocdStart}-${totalSize - 1}` }
    });

    if (!eocdResponse.ok) {
      throw new Error(`Failed to fetch EOCD: ${eocdResponse.status}`);
    }

    const eocdData = new Uint8Array(await eocdResponse.arrayBuffer());
    
    // Find EOCD signature
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
    
    const centralDirSize = dataView.getUint32(12, true);
    const centralDirOffset = dataView.getUint32(16, true);

    // Fetch Central Directory
    const cdResponse = await fetch(zipUrl, {
      headers: { 'Range': `bytes=${centralDirOffset}-${centralDirOffset + centralDirSize - 1}` }
    });

    if (!cdResponse.ok) {
      throw new Error(`Failed to fetch Central Directory: ${cdResponse.status}`);
    }

    const cdData = new Uint8Array(await cdResponse.arrayBuffer());
    
    // Find the specific file in Central Directory
    const fileEntry = findFileInCentralDirectory(cdData, fileName);
    if (!fileEntry) {
      // Log all files to help debug
      const allFiles = getAllFilesFromCentralDirectory(cdData);
      console.log('Available files:', allFiles.map(f => f.filename));
      console.log('Looking for:', fileName);
      throw new Error(`File ${fileName} not found in ZIP archive`);
    }

    // Fetch local file header
    const localHeaderResponse = await fetch(zipUrl, {
      headers: { 'Range': `bytes=${fileEntry.localHeaderOffset}-${fileEntry.localHeaderOffset + 29}` }
    });

    if (!localHeaderResponse.ok) {
      throw new Error(`Failed to fetch local file header for ${fileName}`);
    }

    const localHeaderData = new Uint8Array(await localHeaderResponse.arrayBuffer());
    
    // Parse local file header to get actual data start position
    const localHeaderView = new DataView(localHeaderData.buffer);
    const filenameLength = localHeaderView.getUint16(26, true);
    const extraFieldLength = localHeaderView.getUint16(28, true);
    
    const dataStart = fileEntry.localHeaderOffset + 30 + filenameLength + extraFieldLength;
    const dataEnd = dataStart + fileEntry.compressedSize - 1;

    // Fetch the actual file data
    const fileDataResponse = await fetch(zipUrl, {
      headers: { 'Range': `bytes=${dataStart}-${dataEnd}` }
    });

    if (!fileDataResponse.ok) {
      throw new Error(`Failed to fetch file data for ${fileName}`);
    }

    const compressedData = new Uint8Array(await fileDataResponse.arrayBuffer());
    
    // Decompress the data if needed
    let finalData = compressedData;
    if (fileEntry.compressionMethod === 8) {
      // Deflate compression
      const decompressed = await decompressDeflate(compressedData);
      finalData = decompressed;
    }

    // Convert to base64 for transport
    const base64Data = btoa(String.fromCharCode.apply(null, Array.from(finalData)));

    return new Response(
      JSON.stringify({ 
        success: true, 
        fileData: base64Data,
        fileName: fileName,
        originalSize: fileEntry.uncompressedSize,
        downloadedSize: finalData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error downloading file:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to download file' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getAllFilesFromCentralDirectory(cdData: Uint8Array) {
  const files = [];
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
    
    const filenameLength = dataView.getUint16(28, true);
    const extraFieldLength = dataView.getUint16(30, true);
    const commentLength = dataView.getUint16(32, true);

    // Read filename
    const filenameStart = pos + 46;
    if (filenameStart + filenameLength > cdData.length) break;
    
    const filename = new TextDecoder().decode(cdData.slice(filenameStart, filenameStart + filenameLength));
    files.push({ filename });

    // Move to next entry
    pos += 46 + filenameLength + extraFieldLength + commentLength;
  }

  return files;
}

function findFileInCentralDirectory(cdData: Uint8Array, targetFileName: string) {
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
    
    const compressionMethod = dataView.getUint16(10, true);
    const compressedSize = dataView.getUint32(20, true);
    const uncompressedSize = dataView.getUint32(24, true);
    const filenameLength = dataView.getUint16(28, true);
    const extraFieldLength = dataView.getUint16(30, true);
    const commentLength = dataView.getUint16(32, true);
    const localHeaderOffset = dataView.getUint32(42, true);

    // Read filename
    const filenameStart = pos + 46;
    if (filenameStart + filenameLength > cdData.length) break;
    
    const filename = new TextDecoder().decode(cdData.slice(filenameStart, filenameStart + filenameLength));

    // Check if this is our target file - try exact match and also path variations
    if (filename === targetFileName || 
        filename.endsWith('/' + targetFileName) || 
        filename.replace(/\\/g, '/') === targetFileName.replace(/\\/g, '/')) {
      return {
        filename,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset
      };
    }

    // Move to next entry
    pos += 46 + filenameLength + extraFieldLength + commentLength;
  }

  return null;
}

async function decompressDeflate(compressedData: Uint8Array): Promise<Uint8Array> {
  // Use built-in decompression streams for deflate decompression
  const stream = new DecompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  
  // Create a promise to collect all decompressed chunks
  const chunks: Uint8Array[] = [];
  const readPromise = (async () => {
    let result;
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }
  })();

  // Write the compressed data
  await writer.write(compressedData);
  await writer.close();
  
  // Wait for reading to complete
  await readPromise;
  
  // Combine all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}
