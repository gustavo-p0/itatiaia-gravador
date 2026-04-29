function doGet(e) {
  const folderId = '1kByEbTVDBijyihxl2BNBN1sTFK8be8e4';
  const action = e.parameter.action;

  if (action === 'files') {
    return listFiles(folderId);
  } else if (action === 'url') {
    const fileId = e.parameter.id;
    return getFileUrl(fileId);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function listFiles(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const result = [];

  const audioExtensions = ['.aac', '.m4a', '.mp3', '.wav', '.ogg', '.flac'];
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name && audioExtensions.some(ext => name.toLowerCase().endsWith(ext))) {
      result.push({
        id: file.getId(),
        name: name,
        createdTime: file.getDateCreated().toISOString(),
        size: file.getSize()
      });
    }
  }

  result.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

  return ContentService.createTextOutput(JSON.stringify({ files: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getFileUrl(fileId) {
  const file = DriveApp.getFileById(fileId);
  
  return ContentService.createTextOutput(JSON.stringify({ 
    url: `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`,
    name: file.getName(),
    embedUrl: `https://drive.google.com/uc?id=${fileId}&export=download`
  }))
    .setMimeType(ContentService.MimeType.JSON);
}